"""
PII Microservice (reBuild)
==========================
Reads AI-process results from MinIO, uses PaddleOCR to locate each field
inside the corresponding PDF page, redacts sensitive fields (document,
accountBack, phoneNumber) in the rendered image, uploads the redacted image
back to MinIO, and writes x/y/width/height + confidences into the existing
`payrolls` row for each person.

x/y/width/height are the pixel coordinates of the person's **name** on the
rendered page image (RENDER_SCALE applied). The `confidences` column stores
a JSON object with the OCR confidence score for every located field.

Usage
-----
  python main.py [institutionKey] [--file <filename>] [--year <year>] [--force]
"""

import argparse
import re
import sys

import cv2
import fitz          # PyMuPDF
import numpy as np
from dotenv import load_dotenv
from paddleocr import PaddleOCR

from db import connect, update_payroll_position
from file_manager import FileManagerClient
from matcher import find_match, parse_ocr_result
from redactor import redact_image

load_dotenv()

# ── constants ─────────────────────────────────────────────────────────────────

ALL_FIELDS = ["name", "document", "position", "income", "sex", "accountBack", "phoneNumber"]
SENSITIVE_FIELDS = {"document", "accountBack", "phoneNumber"}

RENDER_SCALE = 2.0

INSTITUTIONS = {
    "ayuntamientoJarabacoa": {
        "institutionName": "Ayuntamiento de Jarabacoa",
        "typeOfData": "nomina",
    },
}

# ── OCR engine ────────────────────────────────────────────────────────────────

print("Loading PaddleOCR …")
ocr_engine = PaddleOCR(use_angle_cls=True, lang="es", show_log=False)
print("PaddleOCR ready.")


# ── helpers ───────────────────────────────────────────────────────────────────

def render_pdf_page(pdf_bytes: bytes, page_index: int, scale: float = RENDER_SCALE) -> bytes:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    page = doc[page_index]
    pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
    doc.close()
    return pix.tobytes("png")


def run_ocr(image_bytes: bytes) -> list[dict]:
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    decoded = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    raw = ocr_engine.ocr(decoded, cls=True)
    return parse_ocr_result(raw)


# ── core processing ───────────────────────────────────────────────────────────

def process_ai_key(ai_key: str, fm: FileManagerClient, conn, force: bool = False):
    pii_key = FileManagerClient.ai_key_to_pii_image_key(ai_key)
    if not force and fm.file_exists(pii_key):
        print(f"  Skipping (exists): {pii_key}")
        return

    # Load AI structured data
    ai_json = fm.get_file_json(ai_key)
    lines = ai_json.get("lines", [])
    if not lines:
        print(f"  No lines in AI result: {ai_key}")
        return

    # Resolve source PDF + page
    pdf_key = FileManagerClient.ai_key_to_pdf_key(ai_key)
    page_index = FileManagerClient.extract_page_index(ai_key)

    try:
        pdf_bytes = fm.get_file_bytes(pdf_key)
    except Exception as exc:
        print(f"  Cannot fetch PDF ({pdf_key}): {exc}")
        return

    print(f"  Rendering page {page_index} from {pdf_key} …")
    image_bytes = render_pdf_page(pdf_bytes, page_index)

    print("  Running OCR …")
    ocr_words = run_ocr(image_bytes)
    if not ocr_words:
        print("  OCR returned no words, skipping.")
        return
    print(f"  OCR found {len(ocr_words)} word(s).")

    redaction_boxes: list[dict] = []

    for line in lines:
        name = (line.get("name") or "").strip()
        if not name:
            continue

        matched: dict[str, dict] = {}   # field → match result

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

            if field in SENSITIVE_FIELDS:
                redaction_boxes.append(m)

        if not matched:
            continue

        # Position stored in DB = name's bounding box (fallback: first matched field)
        # Divide by RENDER_SCALE to convert from rendered-image pixels → PDF points
        name_box = matched.get("name") or next(iter(matched.values()))
        x      = name_box["x"] / RENDER_SCALE
        y      = name_box["y"] / RENDER_SCALE
        width  = name_box["w"] / RENDER_SCALE
        height = name_box["h"] / RENDER_SCALE

        # Confidences: one score per located field
        confidences = {field: round(data["score"], 4) for field, data in matched.items()}

        # Update the payrolls row — try with and without leading slash
        updated = update_payroll_position(
            conn, ai_key, name,
            x, y, width, height,
            confidences,
        )
        if updated == 0:
            alt = ("/" + ai_key) if not ai_key.startswith("/") else ai_key[1:]
            updated = update_payroll_position(
                conn, alt, name,
                x, y, width, height,
                confidences,
            )
        print(f"    Updated {updated} payroll row(s).")

    # Redact sensitive regions and upload
    print(f"  Redacting {len(redaction_boxes)} region(s) …")
    redacted = redact_image(image_bytes, redaction_boxes)
    fm.upload_bytes(pii_key, redacted, content_type="image/png")
    print(f"  Uploaded: {pii_key}")


# ── CLI ───────────────────────────────────────────────────────────────────────

def parse_args():
    p = argparse.ArgumentParser(description="PII redaction microservice")
    p.add_argument("institution_key", nargs="?")
    p.add_argument("--file")
    p.add_argument("--year")
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
                process_ai_key(ai_key, fm, conn, force=args.force)
            except Exception as exc:
                print(f"  ERROR: {exc}")

    conn.close()
    print("\nPII process complete.")


if __name__ == "__main__":
    main()
