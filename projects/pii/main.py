import argparse
import io
import json
import math
import os
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

# DPI used to render each PDF image region. Also the conversion factor between
# corrected-image pixels and PDF points (points = pixels * 72 / RENDER_DPI).
RENDER_DPI = 200

# A page is "straightened" (its mediabox swapped to landscape) only when a single
# image covers at least this fraction of the page and OCR reports a 90/270 turn.
FULL_PAGE_COVERAGE = 0.95


def angle_from_result(result_json: str) -> int:
    obj = json.loads(result_json)
    angle = (obj or {}).get("doc_preprocessor_res", {}).get("angle") or 0
    return 0 if angle == -1 else angle

# Single source of truth: shared/institutions.json. The PII service only
# processes institutions flagged "pii": true.
_INSTITUTIONS_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "shared", "institutions.json"
)
with open(_INSTITUTIONS_PATH, encoding="utf-8") as _f:
    INSTITUTIONS = {k: v for k, v in json.load(_f).items() if v.get("pii")}

print("Loading PaddleOCR ...")
ocr = PaddleOCR(
    use_textline_orientation=True,
    use_doc_orientation_classify=True,
    # Unwarp scales+crops the image unpredictably, so OCR coordinates no longer
    # match the source image (boxes land on blank space). Payroll docs are flat
    # scans/digital PDFs with no curvature — only rotation matters — so we keep
    # orientation correction and disable unwarp to keep coordinates aligned.
    use_doc_unwarping=False,
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



def place_corrected_image(page, original_rect, corrected_bytes: bytes, angle: int,
                          img_w: int, img_h: int, single_image: bool):
    """Draw the upright corrected image into the PDF and return its placement.

    Returns (final_rect, page_width, page_height) in the final page's point
    coordinates. The corrected image is already upright, so we only need to
    place it without distortion:

    - Full-page scan turned 90/270°: the upright image is landscape where the
      page is portrait (or vice-versa). Filling the original (portrait) rect
      would squash it, so we swap the page's mediabox to the upright aspect and
      let the image fill the whole page — straightening the page.
    - Everything else (angle 0/180, or a sub-image, or multiple images): replace
      the image in place. Aspect is preserved for 0/180; for a small turned
      sub-image the per-axis fit is harmless and the page layout is left intact.
    """
    page_rect = page.rect
    coverage = (original_rect.width * original_rect.height) / (page_rect.width * page_rect.height)
    straighten = single_image and angle in (90, 270) and coverage >= FULL_PAGE_COVERAGE

    if straighten:
        new_w = img_w * 72.0 / RENDER_DPI
        new_h = img_h * 72.0 / RENDER_DPI
        page.set_rotation(0)
        page.set_mediabox(fitz.Rect(0, 0, new_w, new_h))
        final_rect = page.rect
    else:
        final_rect = original_rect

    page.draw_rect(final_rect, color=(1, 1, 1), fill=(1, 1, 1))
    page.insert_image(final_rect, stream=corrected_bytes, keep_proportion=False)
    return final_rect, page.rect.width, page.rect.height


def run_ocr(image_bytes: bytes) -> tuple[str, bytes, int]:
    """Run PaddleOCR. Returns (result_json_str, corrected_image_bytes, angle).

    All intermediate files (the input image and PaddleOCR's output) are written
    into an isolated per-call temp directory and kept on disk so the downloaded
    and generated images can be inspected for debugging.
    """
    uuid_ = str(uuid.uuid4())
    work_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tmp", uuid_)
    os.makedirs(work_dir, exist_ok=True)
    filename = os.path.join(work_dir, f"{uuid_}.png")
    outfile = os.path.join(work_dir, "output")

    src_img = Image.open(io.BytesIO(image_bytes))
    src_img.save(filename)

    # Fit the detection side-limit to the image itself so PaddleOCR never
    # downscales it (default limit is 4000). Detecting at full resolution keeps
    # small text sharp and avoids losing precision on large payroll scans.
    max_side = max(src_img.size)

    result = ocr.predict(
        filename,
        text_det_limit_type="max",
        text_det_limit_side_len=max_side,
    )
    for res in result:
        res.save_to_img(outfile)
        res.save_to_json(outfile)

    with open(os.path.join(outfile, f"{uuid_}_res.json"), "r") as f:
        result_json = f.read()

    angle = angle_from_result(result_json)

    # PaddleOCR's _preprocessed_img.png contains [original | corrected] side by
    # side. Crop the corrected half using the rotated dimensions of the source.
    original_img = Image.open(filename)
    preprocessed_img = Image.open(os.path.join(outfile, f"{uuid_}_preprocessed_img.png"))
    width, height = original_img.size
    new_width, new_height = calculate_rotated_dimensions(width, height, angle)

    corrected_img = preprocessed_img.crop((width, 0, width + new_width, new_height))
    corrected_io = io.BytesIO()
    corrected_img.save(corrected_io, format="PNG")
    corrected_bytes = corrected_io.getvalue()

    print(f"    Kept OCR work dir:  {work_dir}")
    return result_json, corrected_bytes, angle


def process_image(image_bytes: bytes, image_ext: str, base_name: str,
                  page_index: int, img_index: int, download_key: str,
                  fm: FileManagerClient, force: bool) -> tuple[bytes, int, int, int] | None:
    """Upload raw image, run OCR, upload results.

    Returns (corrected_bytes, angle, img_width, img_height) — the corrected
    (upright) image and the geometry the caller needs to place it in the PDF and
    to map OCR coordinates. The OCR polygons live in the corrected image's pixel
    space, so img_width/height come from that image.
    """
    suffix_img       = f"{base_name}_page{page_index}_img{img_index}.{image_ext}"
    suffix_ocr       = f"{base_name}_page{page_index}_img{img_index}.json"
    suffix_processed = f"{base_name}_page{page_index}_img{img_index}.png"

    img_key       = replace_stage(download_key, "images", suffix_img)
    ocr_key       = replace_stage(download_key, "extractedText", suffix_ocr)
    processed_key = replace_stage(download_key, "imgProcessed", suffix_processed)

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
        print(f"    Uploaded OCR:       {ocr_key}")
        print(f"    Uploaded processed: {processed_key} (angle={angle}°)")
    else:
        print(f"    OCR exists (skip):  {ocr_key}")
        corrected_bytes = fm.get_file_bytes(processed_key)
        # pdfFixed is being rebuilt, so we still need the angle to place the
        # image — recover it from the cached OCR result.
        angle = angle_from_result(fm.get_file_bytes(ocr_key).decode())

    img_w, img_h = Image.open(io.BytesIO(corrected_bytes)).size
    return corrected_bytes, angle, img_w, img_h


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

            # page.get_images() also returns images with no placement on the
            # page (masks/SMasks). Skipping those with enumerate's index would
            # leave gaps (e.g. no _img0), but the frontend probes images
            # contiguously from _img0 and stops at the first gap. Use a separate
            # counter that only advances for images actually uploaded, so output
            # files are always contiguous and 0-based.
            img_index = 0
            for img in image_list:
                xref = img[0]
                image_rects = page.get_image_rects(xref)
                if not image_rects:
                    continue
                original_rect = image_rects[0]

                # Render the image region as it appears on the page (applies the
                # PDF's transformation matrix, so rotation/orientation is correct).
                pix = page.get_pixmap(clip=original_rect, dpi=RENDER_DPI)
                image_bytes = pix.tobytes("png")

                result = process_image(
                    image_bytes=image_bytes,
                    image_ext="png",
                    base_name=base_name,
                    page_index=page_index,
                    img_index=img_index,
                    download_key=pdf_key,
                    fm=fm,
                    force=force,
                )
                if not result:
                    continue
                corrected_bytes, angle, img_w, img_h = result

                final_rect, page_w, page_h = place_corrected_image(
                    page=page,
                    original_rect=original_rect,
                    corrected_bytes=corrected_bytes,
                    angle=angle,
                    img_w=img_w,
                    img_h=img_h,
                    single_image=len(image_list) == 1,
                )
                print(f"    Replaced img page={page_index} img={img_index} (angle={angle}°)")

                # Placement metadata so the frontend can map OCR pixel coords →
                # final PDF page points: point = rect.origin + (px/img) * rect.size.
                meta = {
                    "angle": angle,
                    "imgWidth": img_w,
                    "imgHeight": img_h,
                    "rect": [final_rect.x0, final_rect.y0, final_rect.width, final_rect.height],
                    "page": [page_w, page_h],
                }
                meta_suffix = f"{base_name}_page{page_index}_img{img_index}_meta.json"
                meta_key = replace_stage(pdf_key, "imgProcessed", meta_suffix)
                fm.upload_bytes(meta_key, json.dumps(meta).encode(), "application/json")

                img_index += 1

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
