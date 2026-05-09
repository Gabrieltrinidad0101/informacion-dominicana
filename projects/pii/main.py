"""
PII Microservice (reBuild)
==========================
Reads AI-process results from MinIO, uses PaddleOCR to locate each field
inside the corresponding PDF page, redacts sensitive fields (document,
accountBack, phoneNumber) in the rendered image, uploads the redacted image
back to MinIO, and writes x/y/width/height + confidences into the existing
`payrolls` row for each person.

Rotation handling
-----------------
If the source PDF page has a non-zero /Rotate entry (90, 180, 270), PyMuPDF
renders it correctly oriented BUT the stored PDF still has rotated content.
In that case this service:
  1. Renders the page at 1× (correctly oriented by PyMuPDF).
  2. Builds a new single-page PDF from that image (rotation = 0).
  3. Uploads the corrected PDF to MinIO under …/pii/…_corrected.pdf.
  4. Runs OCR on the same correctly-oriented image (at RENDER_SCALE).
  5. Divides OCR pixel coords by RENDER_SCALE to get points in the
     corrected PDF coordinate space.

Usage
-----
  python main.py [institutionKey] [--file <filename>] [--year <year>] [--force]
"""

import os
import argparse
import io
import json
import math
import re
import shutil
import sys
import uuid
from io import BytesIO

import fitz          # PyMuPDF
from dotenv import load_dotenv
from paddleocr import PaddleOCR
from PIL import Image


from db import connect, update_payroll_position
from file_manager import FileManagerClient
from matcher import find_match, parse_ocr_result
load_dotenv()

# ── constants ─────────────────────────────────────────────────────────────────

ALL_FIELDS = ["name", "document", "position", "income", "sex", "accountBack", "phoneNumber"]

# Scale used when rendering the page for OCR (2× ≈ 144 DPI)
RENDER_SCALE = 2.0

INSTITUTIONS = {
    "ayuntamientoJarabacoa": {
        "institutionName": "Ayuntamiento de Jarabacoa",
        "typeOfData": "nomina",
    },
}

# ── OCR engine (loaded once) ──────────────────────────────────────────────────

print("Loading PaddleOCR …")
ocr_engine = PaddleOCR(
    use_textline_orientation=True,
    use_doc_orientation_classify=True,
    lang="es"
)
print("PaddleOCR ready.")


# ── PDF helpers ───────────────────────────────────────────────────────────────

def get_page_rotation(pdf_bytes: bytes, page_index: int) -> int:
    """Return the /Rotate value of the page (0, 90, 180 or 270)."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    rotation = doc[page_index].rotation
    doc.close()
    return rotation


def render_page(pdf_bytes: bytes, page_index: int, scale: float) -> bytes:
    """
    Render a PDF page to PNG at `scale`×.
    PyMuPDF automatically applies the page /Rotate, so the returned image
    is always correctly oriented regardless of the stored rotation.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pix = doc[page_index].get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
    doc.close()
    return pix.tobytes("png")


def append_page_to_pdf(base_pdf_bytes: bytes | None, image_bytes: bytes) -> bytes:
    """
    Append a new page built from `image_bytes` to `base_pdf_bytes`.
    If `base_pdf_bytes` is None, creates a new PDF with that single page.
    """
    doc = fitz.open(stream=base_pdf_bytes, filetype="pdf") if base_pdf_bytes else fitz.open()
    pil_img = Image.open(io.BytesIO(image_bytes))
    img_w, img_h = pil_img.size
    new_page = doc.new_page(width=img_w, height=img_h)
    new_page.insert_image(fitz.Rect(0, 0, img_w, img_h), stream=image_bytes)
    out = io.BytesIO()
    doc.save(out)
    doc.close()
    return out.getvalue()


# ── OCR ───────────────────────────────────────────────────────────────────────

def _calculate_rotated_dimensions(width, height, angle_degrees):
    angle_rad = math.radians(angle_degrees)
    cos_theta = abs(math.cos(angle_rad))
    sin_theta = abs(math.sin(angle_rad))
    return (
        width * cos_theta + height * sin_theta,
        width * sin_theta + height * cos_theta,
    )


def run_ocr(image_bytes: bytes) -> tuple[list[dict], bytes]:
    """
    Run PaddleOCR on image_bytes using the new predict() API.

    Returns (ocr_words, corrected_image_bytes) where corrected_image_bytes is
    the preprocessed/orientation-corrected image that OCR coordinates reference.
    PaddleOCR saves a side-by-side preprocessed_img.png [original | corrected];
    we crop the right half to get the corrected image.
    """
    uuid_ = str(uuid.uuid4())
    filename = f"./{uuid_}.png"
    outfile = "output"

    img = Image.open(BytesIO(image_bytes))
    img.save(filename)

    result = ocr_engine.predict(filename)
    for res in result:
        res.save_to_img(outfile)
        res.save_to_json(outfile)

    result_json_path = f"{outfile}/{uuid_}_res.json"
    with open(result_json_path, "r") as f:
        result_obj = json.load(f)

    # Crop corrected half from preprocessed_img (PaddleOCR: [original | corrected])
    original_img = Image.open(filename)
    preprocessed_img = Image.open(f"{outfile}/{uuid_}_preprocessed_img.png")
    width, height = original_img.size

    angle = (result_obj or {}).get("doc_preprocessor_res", {}).get("angle") or 0
    if angle == -1:
        angle = 0
    new_width, new_height = _calculate_rotated_dimensions(width, height, angle)

    corrected_img = preprocessed_img.crop((width, 0, width + new_width, new_height))

    corrected_io = io.BytesIO()
    corrected_img.save(corrected_io, format="PNG")
    corrected_image_bytes = corrected_io.getvalue()

    shutil.rmtree(outfile)
    os.remove(filename)

    ocr_words = parse_ocr_result(result_obj)
    return ocr_words, corrected_image_bytes


# ── core processing ───────────────────────────────────────────────────────────

def process_ai_key(ai_key: str, fm: FileManagerClient, conn):
    # ── AI data ───────────────────────────────────────────────────────────────
    ai_json = fm.get_file_json(ai_key)
    lines = ai_json.get("lines", [])
    if not lines:
        print(f"  No lines in AI result: {ai_key}")
        return

    # ── source PDF ────────────────────────────────────────────────────────────
    pdf_key = FileManagerClient.ai_key_to_pdf_key(ai_key)
    page_index = FileManagerClient.extract_page_index(ai_key)

    try:
        pdf_bytes = fm.get_file_bytes(pdf_key)
    except Exception as exc:
        print(f"  Cannot fetch PDF ({pdf_key}): {exc}")
        return

    # ── rotation detection ────────────────────────────────────────────────────
    rotation = get_page_rotation(pdf_bytes, page_index)
    print(f"  Page rotation: {rotation}°")

    # ── render for OCR (always correctly oriented) ────────────────────────────
    print(f"  Rendering page {page_index} at {RENDER_SCALE}× …")
    image_bytes = render_page(pdf_bytes, page_index, scale=RENDER_SCALE)

    # ── OCR ───────────────────────────────────────────────────────────────────
    print("  Running OCR …")
    ocr_words, corrected_image_bytes = run_ocr(image_bytes)
    if not ocr_words:
        print("  OCR returned no words, skipping.")
        return
    print(f"  OCR found {len(ocr_words)} word(s).")

    # ── match fields per person ───────────────────────────────────────────────
    for line in lines:
        name = (line.get("name") or "").strip()
        if not name:
            continue

        matched: dict[str, dict] = {}

        for field in ALL_FIELDS:
            value = (line.get(field) or "").strip()
            if not value:
                continue

            m = find_match(value, ocr_words)
            if m is None:
                print(f"    [{field}] '{value}' — no OCR match")
                continue

            matched[field] = {**m, "ai_value": value}
            print(
                f"    [{field}] AI='{value}' → OCR='{m['ocr_value']}' "
                f"score={m['score']:.2f} "
                f"box=({m['x']:.0f},{m['y']:.0f},{m['w']:.0f},{m['h']:.0f})"
            )

        if not matched:
            continue

        # ── coordinates in PDF-point space ────────────────────────────────────
        # OCR coords are in pixels of the RENDER_SCALE image.
        # Dividing by RENDER_SCALE converts to PDF points.
        # When rotation != 0 the corrected PDF was built from the same
        # correctly-oriented render at scale=1, so the coordinate space matches.
        name_box = matched.get("name") or next(iter(matched.values()))
        x      = name_box["x"] / RENDER_SCALE
        y      = name_box["y"] / RENDER_SCALE
        width  = name_box["w"] / RENDER_SCALE
        height = name_box["h"] / RENDER_SCALE

        confidences = {f: round(d["score"], 4) for f, d in matched.items()}

        updated = update_payroll_position(conn, ai_key, name, x, y, width, height, confidences)
        if updated == 0:
            alt = ("/" + ai_key) if not ai_key.startswith("/") else ai_key[1:]
            updated = update_payroll_position(conn, alt, name, x, y, width, height, confidences)
        print(f"    Updated {updated} payroll row(s).")

    # ── append corrected page to monthly PDF ──────────────────────────────────
    pii_pdf_key = FileManagerClient.ai_key_to_pii_month_pdf_key(ai_key)
    try:
        base_pdf_bytes = fm.get_file_bytes(pii_pdf_key)
        print(f"  Appending to existing monthly PDF: {pii_pdf_key}")
    except Exception:
        base_pdf_bytes = None
        print(f"  Creating new monthly PDF: {pii_pdf_key}")

    pii_pdf_bytes = append_page_to_pdf(base_pdf_bytes, corrected_image_bytes)
    fm.upload_bytes(pii_pdf_key, pii_pdf_bytes, content_type="application/pdf")
    print(f"  Uploaded monthly pii PDF: {pii_pdf_key}")


# ── CLI ───────────────────────────────────────────────────────────────────────

def parse_args():
    p = argparse.ArgumentParser(description="PII redaction microservice")
    p.add_argument("institution_key", nargs="?")
    p.add_argument("--file")
    p.add_argument("--year")
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
    conn = connect()

    for institution in target:
        prefix = f"{institution['institutionName']}/{institution['typeOfData']}/aiProcess/"
        print(f"\nScanning MinIO: {prefix}")

        keys = fm.list_files(prefix)

        if args.year:
            keys = [k for k in keys if k.split("/")[3] == args.year]
        if args.file:
            keys = [k for k in keys if k == args.file or k.endswith(f"/{args.file}")]
            if not keys:
                print(f"  No file matching '{args.file}' under {prefix}")
                continue

        page_keys = [k for k in keys if re.search(r"_page\d+\.json$", k)]
        print(f"Found {len(page_keys)} page file(s)")

        for ai_key in page_keys:
            print(f"\nProcessing: {ai_key}")
            try:
                process_ai_key(ai_key, fm, conn)
            except Exception as exc:
                print(f"  ERROR: {exc}")

    conn.close()
    print("\nPII process complete.")


if __name__ == "__main__":
    main()
