import argparse
import io
import json
import math
import os
import shutil
import sys
import uuid

import fitz
from dotenv import load_dotenv
from paddleocr import PaddleOCR
from PIL import Image

from file_manager import FileManagerClient

load_dotenv()

CONTENT_TYPES = {
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "webp": "image/webp",
}

INSTITUTIONS = {
    "ayuntamientoJarabacoa": {
        "institutionName": "Ayuntamiento de Jarabacoa",
        "typeOfData": "nomina",
    },
    "ayuntamientoMoca": {
        "institutionName": "Ayuntamiento de Moca",
        "typeOfData": "nomina",
    }
}

print("Loading PaddleOCR ...")
ocr = PaddleOCR(
    use_textline_orientation=True,
    use_doc_orientation_classify=True,
    use_doc_unwarping=True,
    lang="es",
)
print("PaddleOCR ready.")


def replace_stage(key: str, stage: str, suffix: str) -> str:
    parts = key.split("/")
    parts[2] = stage
    parts[-1] = suffix
    return "/".join(parts)


def calculate_rotated_dimensions(width, height, angle_degrees):
    angle_rad = math.radians(angle_degrees)
    cos_theta = abs(math.cos(angle_rad))
    sin_theta = abs(math.sin(angle_rad))
    return width * cos_theta + height * sin_theta, width * sin_theta + height * cos_theta



def adjust_rect_for_rotation(rect: fitz.Rect, angle: int) -> fitz.Rect:
    """Swap width/height around the same center for 90°/270° corrected images."""
    if angle not in (90, 270):
        return rect
    cx = (rect.x0 + rect.x1) / 2
    cy = (rect.y0 + rect.y1) / 2
    w = rect.x1 - rect.x0
    h = rect.y1 - rect.y0
    return fitz.Rect(cx - h / 2, cy - w / 2, cx + h / 2, cy + w / 2)


def apply_rotation_if_needed(image_bytes: bytes, rect: fitz.Rect, angle: int) -> tuple[bytes, int]:
    """
    PaddleOCR returns angle=0 when it doesn't detect rotation, but the image
    may still be stored at 90° in the PDF. Detect this by comparing the image
    aspect ratio against the display rect: if one is portrait and the other is
    landscape, the image needs a 90° rotation.
    """
    if angle != 0:
        return image_bytes, angle

    img = Image.open(io.BytesIO(image_bytes))
    img_landscape = img.width > img.height
    rect_landscape = (rect.x1 - rect.x0) > (rect.y1 - rect.y0)

    if img_landscape == rect_landscape:
        return image_bytes, angle

    rotated = img.rotate(-90, expand=True)
    out = io.BytesIO()
    rotated.save(out, format="PNG")
    print(f"    Aspect ratio mismatch detected — applied 90° rotation")
    return out.getvalue(), 90


def run_ocr(image_bytes: bytes) -> tuple[str, bytes, int]:
    """Run PaddleOCR. Returns (result_json_str, corrected_image_bytes, angle)."""
    uuid_ = str(uuid.uuid4())
    filename = f"./{uuid_}.png"
    outfile = "output"

    Image.open(io.BytesIO(image_bytes)).save(filename)

    result = ocr.predict(filename)
    for res in result:
        res.save_to_img(outfile)
        res.save_to_json(outfile)

    with open(f"{outfile}/{uuid_}_res.json", "r") as f:
        result_json = f.read()

    result_obj = json.loads(result_json)
    angle = (result_obj or {}).get("doc_preprocessor_res", {}).get("angle") or 0
    if angle == -1:
        angle = 0

    # PaddleOCR's _preprocessed_img.png contains [original | corrected] side by
    # side. Crop the corrected half using the rotated dimensions of the source.
    original_img = Image.open(filename)
    preprocessed_img = Image.open(f"{outfile}/{uuid_}_preprocessed_img.png")
    width, height = original_img.size
    new_width, new_height = calculate_rotated_dimensions(width, height, angle)

    corrected_img = preprocessed_img.crop((width, 0, width + new_width, new_height))
    corrected_io = io.BytesIO()
    corrected_img.save(corrected_io, format="PNG")
    corrected_bytes = corrected_io.getvalue()

    shutil.rmtree(outfile)
    os.remove(filename)

    return result_json, corrected_bytes, angle


def process_image(image_bytes: bytes, image_ext: str, base_name: str,
                  page_index: int, img_index: int, download_key: str,
                  fm: FileManagerClient, force: bool) -> bytes | None:
    """Upload raw image, run OCR, upload results. Returns corrected_bytes."""
    suffix_img       = f"{base_name}_page{page_index}_img{img_index}.{image_ext}"
    suffix_ocr       = f"{base_name}_page{page_index}_img{img_index}.json"
    suffix_processed = f"{base_name}_page{page_index}_img{img_index}.png"
    suffix_angle     = f"{base_name}_page{page_index}_img{img_index}_angle.json"

    img_key       = replace_stage(download_key, "images", suffix_img)
    ocr_key       = replace_stage(download_key, "extractedText", suffix_ocr)
    processed_key = replace_stage(download_key, "imgProcessed", suffix_processed)
    angle_key     = replace_stage(download_key, "imgProcessed", suffix_angle)

    if force or not fm.file_exists(img_key):
        fm.upload_bytes(img_key, image_bytes, CONTENT_TYPES.get(image_ext, "application/octet-stream"))
        print(f"    Uploaded image:     {img_key}")
    else:
        print(f"    Image exists (skip): {img_key}")

    if force or not fm.file_exists(ocr_key) or not fm.file_exists(processed_key):
        print(f"    Running OCR ...")
        result_json, corrected_bytes, angle = run_ocr(image_bytes)
        fm.upload_bytes(ocr_key, result_json.encode(), "application/json")
        fm.upload_bytes(processed_key, corrected_bytes, "image/png")
        fm.upload_bytes(angle_key, json.dumps({"angle": angle}).encode(), "application/json")
        print(f"    Uploaded OCR:       {ocr_key}")
        print(f"    Uploaded processed: {processed_key} (angle={angle}°)")
    else:
        print(f"    OCR exists (skip):  {ocr_key}")
        corrected_bytes = fm.get_file_bytes(processed_key)

    return corrected_bytes


def extract_images_from_pdf(pdf_key: str, fm: FileManagerClient, force: bool):
    print(f"\nProcessing: {pdf_key}")

    pdf_bytes = fm.get_file_bytes(pdf_key)
    base_name = pdf_key.split("/")[-1].replace(".pdf", "")
    pdf_fixed_key = replace_stage(pdf_key, "pdfFixed", f"{base_name}.pdf")

    if not force and fm.file_exists(pdf_fixed_key):
        print(f"  pdfFixed exists (skip): {pdf_fixed_key}")
        return

    # Single doc open — all replacements applied on it, one save at the end
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    try:
        for page_index, page in enumerate(doc):
            image_list = page.get_images(full=True)
            print(f"  Page {page_index}: {len(image_list)} image(s)")

            for img_index, img in enumerate(image_list):
                xref = img[0]
                image_rects = page.get_image_rects(xref)
                if not image_rects:
                    continue
                original_rect = image_rects[0]

                # Render the image region as it appears on the page (applies the
                # PDF's transformation matrix, so rotation/orientation is correct).
                pix = page.get_pixmap(clip=original_rect, dpi=200)
                image_bytes = pix.tobytes("png")

                corrected_bytes = process_image(
                    image_bytes=image_bytes,
                    image_ext="png",
                    base_name=base_name,
                    page_index=page_index,
                    img_index=img_index,
                    download_key=pdf_key,
                    fm=fm,
                    force=force,
                )

                if corrected_bytes:
                    page.draw_rect(original_rect, color=(1, 1, 1), fill=(1, 1, 1))
                    page.insert_image(original_rect, stream=corrected_bytes, keep_proportion=False)
                    print(f"    Replaced img page={page_index} img={img_index}")

        out = io.BytesIO()
        doc.save(out)
        fm.upload_bytes(pdf_fixed_key, out.getvalue(), "application/pdf")
        print(f"  Uploaded pdfFixed: {pdf_fixed_key}")

    finally:
        doc.close()


def parse_args():
    p = argparse.ArgumentParser(description="PII — extract images and OCR text from PDFs")
    p.add_argument("institution_key", nargs="?")
    p.add_argument("--year")
    p.add_argument("--month")
    p.add_argument("--force", action="store_true")
    return p.parse_args()


def main():
    args = parse_args()

    if args.institution_key and args.institution_key not in INSTITUTIONS:
        print(f"Unknown institution: '{args.institution_key}'")
        print("Available:", ", ".join(INSTITUTIONS))
        sys.exit(1)

    target = (
        [INSTITUTIONS[args.institution_key]]
        if args.institution_key
        else list(INSTITUTIONS.values())
    )

    fm = FileManagerClient()

    for institution in target:
        prefix = f"{institution['institutionName']}/{institution['typeOfData']}/download/"
        print(f"\nScanning MinIO: {prefix}")

        keys = fm.list_files(prefix)

        if args.year:
            keys = [k for k in keys if k.split("/")[3] == args.year]
        if args.month:
            keys = [k for k in keys if k.split("/")[4] == args.month]

        pdf_keys = [k for k in keys if k.endswith(".pdf")]
        print(f"Found {len(pdf_keys)} PDF(s)")

        for pdf_key in pdf_keys:
            try:
                extract_images_from_pdf(pdf_key, fm, force=args.force)
            except Exception as exc:
                print(f"  ERROR: {exc}")

    print("\nDone.")


if __name__ == "__main__":
    main()
