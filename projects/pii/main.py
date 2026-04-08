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

import argparse
import io
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
ocr_engine = PaddleOCR(use_textline_orientation=True, lang="es")
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


def build_corrected_pdf(pdf_bytes: bytes, page_index: int) -> bytes:
    """
    Create a new single-page PDF from the correctly-oriented render of
    `page_index`.  The result has rotation = 0 and matches the coordinate
    space used by OCR (after dividing by RENDER_SCALE).

    Called only when the source page has rotation != 0.
    """
    # Render at 1× so that 1 pixel == 1 PDF point in the new document
    img_bytes = render_page(pdf_bytes, page_index, scale=1.0)

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    orig_page = doc[page_index]
    # After rotation, the effective dimensions swap for 90/270
    effective_w = orig_page.rect.width  if orig_page.rotation % 180 == 0 else orig_page.rect.height
    effective_h = orig_page.rect.height if orig_page.rotation % 180 == 0 else orig_page.rect.width
    doc.close()

    new_doc = fitz.open()
    new_page = new_doc.new_page(width=effective_w, height=effective_h)
    new_page.insert_image(fitz.Rect(0, 0, effective_w, effective_h), stream=img_bytes)

    out = io.BytesIO()
    new_doc.save(out)
    new_doc.close()
    return out.getvalue()


# ── OCR ───────────────────────────────────────────────────────────────────────

def run_ocr(image_bytes: bytes) -> list[dict]:
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    decoded = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    raw = ocr_engine.ocr(decoded, cls=True)
    return parse_ocr_result(raw)


# ── core processing ───────────────────────────────────────────────────────────

def process_ai_key(ai_key: str, fm: FileManagerClient, conn, force: bool = False):
    pii_img_key = FileManagerClient.ai_key_to_pii_image_key(ai_key)
    if not force and fm.file_exists(pii_img_key):
        print(f"  Skipping (exists): {pii_img_key}")
        return

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

    if rotation != 0:
        print(f"  Building corrected PDF (rotation={rotation}° → 0°) …")
        corrected_pdf_bytes = build_corrected_pdf(pdf_bytes, page_index)
        pii_pdf_key = FileManagerClient.ai_key_to_pii_pdf_key(ai_key)
        fm.upload_bytes(pii_pdf_key, corrected_pdf_bytes, content_type="application/pdf")
        print(f"  Uploaded corrected PDF: {pii_pdf_key}")

    # ── render for OCR (always correctly oriented) ────────────────────────────
    print(f"  Rendering page {page_index} at {RENDER_SCALE}× …")
    image_bytes = render_page(pdf_bytes, page_index, scale=RENDER_SCALE)

    # ── OCR ───────────────────────────────────────────────────────────────────
    print("  Running OCR …")
    ocr_words = run_ocr(image_bytes)
    if not ocr_words:
        print("  OCR returned no words, skipping.")
        return
    print(f"  OCR found {len(ocr_words)} word(s).")

    # ── match + redact per person ─────────────────────────────────────────────
    redaction_boxes: list[dict] = []

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

            if field in SENSITIVE_FIELDS:
                redaction_boxes.append(m)

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

    # ── redact image ──────────────────────────────────────────────────────────
    print(f"  Redacting {len(redaction_boxes)} sensitive region(s) …")
    redacted = redact_image(image_bytes, redaction_boxes)
    fm.upload_bytes(pii_img_key, redacted, content_type="image/png")
    print(f"  Uploaded redacted image: {pii_img_key}")


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
