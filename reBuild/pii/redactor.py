"""
Image redaction: draws black rectangles over sensitive regions.

Input:  raw PNG bytes (from a rendered PDF page)
Input:  list of {x, y, w, h} bounding boxes to redact (in pixel coords)
Output: PNG bytes with those regions blacked out
"""

import io
from PIL import Image, ImageDraw


def redact_image(image_bytes: bytes, boxes: list[dict]) -> bytes:
    """
    Black-out every bounding box in `boxes` on the given PNG image.

    Args:
        image_bytes: raw PNG bytes of the source image.
        boxes: list of dicts with float keys x, y, w, h (pixel coords).

    Returns:
        PNG bytes of the redacted image.
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    draw = ImageDraw.Draw(img)

    for box in boxes:
        x = int(box["x"])
        y = int(box["y"])
        x2 = x + int(box["w"])
        y2 = y + int(box["h"])
        draw.rectangle([(x, y), (x2, y2)], fill=(0, 0, 0))

    out = io.BytesIO()
    img.save(out, format="PNG")
    return out.getvalue()
