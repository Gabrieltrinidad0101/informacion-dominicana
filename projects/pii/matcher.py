"""
Fuzzy matcher between AI-extracted text and PaddleOCR words.

PaddleOCR returns boxes in the format:
  [ [[x1,y1],[x2,y2],[x3,y3],[x4,y4]], (text, confidence) ]

This module:
  1. Parses raw OCR output into a flat list of word dicts {text, x, y, w, h}.
  2. Given an AI value (possibly cleaned/corrected), finds the best matching
     word or span of consecutive words in the OCR list using fuzzy similarity.
  3. Returns the merged bounding box for the match.

Matching strategy
-----------------
- Normalize both sides: NFKD decomposition → ASCII drop → lowercase → collapse whitespace.
- For single-word values: compare each OCR word individually.
- For multi-word values: use a sliding window of consecutive OCR words whose
  combined text is compared to the full AI value.
- A match is accepted if SequenceMatcher ratio ≥ THRESHOLD.
"""

import unicodedata
import re
from difflib import SequenceMatcher
from typing import Optional

THRESHOLD = 0.72


# ── normalisation ─────────────────────────────────────────────────────────────

def _norm(text: str) -> str:
    """Normalise text for fuzzy comparison."""
    # Decompose accented chars (á → a + combining accent) then drop non-ASCII
    nfd = unicodedata.normalize("NFKD", text)
    ascii_only = nfd.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"\s+", " ", ascii_only).strip().lower()


def _similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


# ── OCR parsing ───────────────────────────────────────────────────────────────

def parse_ocr_result(result_obj: dict) -> list[dict]:
    """
    Convert new PaddleOCR predict() JSON output to a flat list of word records.

    result_obj structure:
      {
        "rec_texts":  ["text", ...],
        "rec_scores": [confidence, ...],
        "rec_polys":  [[[x1,y1],[x2,y2],[x3,y3],[x4,y4]], ...]
      }
    Bounding box uses diagonal p0→p2 for center, edge lengths for width/height
    (same logic as extractedTextAnalyzer/src/paddleocr.js).
    """
    import math as _math

    words = []
    if not result_obj:
        return words

    rec_texts  = result_obj.get("rec_texts",  [])
    rec_scores = result_obj.get("rec_scores", [])
    rec_polys  = result_obj.get("rec_polys",  [])

    for text, conf, poly in zip(rec_texts, rec_scores, rec_polys):
        text = (text or "").strip()
        if not poly or len(poly) != 4:
            continue

        p0, p1, p2, p3 = poly
        cx = (p0[0] + p2[0]) / 2
        cy = (p0[1] + p2[1]) / 2
        w  = _math.hypot(p1[0] - p0[0], p1[1] - p0[1])
        h  = _math.hypot(p3[0] - p0[0], p3[1] - p0[1])

        words.append({
            "text": text,
            "x": float(cx - w / 2),
            "y": float(cy - h / 2),
            "w": float(w),
            "h": float(h),
            "conf": float(conf),
        })
    return words


# ── bounding box merge ────────────────────────────────────────────────────────

def _merge_boxes(boxes: list[dict]) -> dict:
    """Return the union bounding box of a list of word dicts."""
    x = min(b["x"] for b in boxes)
    y = min(b["y"] for b in boxes)
    x2 = max(b["x"] + b["w"] for b in boxes)
    y2 = max(b["y"] + b["h"] for b in boxes)
    return {"x": x, "y": y, "w": x2 - x, "h": y2 - y}


# ── main matching function ────────────────────────────────────────────────────

def find_match(ai_value: str, ocr_words: list[dict]) -> Optional[dict]:
    """
    Find the OCR word (or span of words) that best matches ai_value.

    Returns a dict with keys: x, y, w, h, ocr_value, score
    or None if no match exceeds THRESHOLD.
    """
    if not ai_value or not ai_value.strip() or not ocr_words:
        return None

    norm_ai = _norm(ai_value)
    ai_tokens = norm_ai.split()
    n_tokens = len(ai_tokens)

    best_score = 0.0
    best_boxes: list[dict] = []
    best_text = ""

    # Single-word case — compare each OCR word individually
    if n_tokens <= 1:
        for word in ocr_words:
            score = _similarity(norm_ai, _norm(word["text"]))
            if score > best_score:
                best_score = score
                best_boxes = [word]
                best_text = word["text"]
    else:
        # Multi-word: sliding window of size n_tokens over the OCR words list.
        # The OCR words are ordered top-to-bottom, left-to-right by PaddleOCR,
        # so consecutive indices usually form adjacent text spans.
        for start in range(len(ocr_words) - n_tokens + 1):
            span = ocr_words[start: start + n_tokens]
            combined = " ".join(_norm(w["text"]) for w in span)
            score = _similarity(norm_ai, combined)
            if score > best_score:
                best_score = score
                best_boxes = span
                best_text = " ".join(w["text"] for w in span)

        # Also try with window sizes ±1 to handle OCR splits/merges
        for window in (n_tokens - 1, n_tokens + 1):
            if window < 1 or window > len(ocr_words):
                continue
            for start in range(len(ocr_words) - window + 1):
                span = ocr_words[start: start + window]
                combined = " ".join(_norm(w["text"]) for w in span)
                score = _similarity(norm_ai, combined)
                if score > best_score:
                    best_score = score
                    best_boxes = span
                    best_text = " ".join(w["text"] for w in span)

    if best_score < THRESHOLD or not best_boxes:
        return None

    merged = _merge_boxes(best_boxes)
    return {**merged, "ocr_value": best_text, "score": best_score}
