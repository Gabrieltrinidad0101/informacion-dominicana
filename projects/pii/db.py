"""
PostgreSQL helper — updates existing `payrolls` rows with OCR positions.

The table already has: x, y, width, height, confidences.
We update those columns for the matching row (matched by internalLink + name).

x/y/width/height → bounding box of the person's name on the page (pixel coords
                    of the rendered image). Used later to know where to redact.
confidences      → JSON string with per-field OCR confidence scores.
"""

import json
import os

import psycopg2


def connect():
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "postgres"),
        port=int(os.getenv("POSTGRES_PORT", "5432")),
        dbname=os.getenv("POSTGRES_DB", "informacion-dominicana"),
        user=os.getenv("POSTGRES_DB_USER", "myuser"),
        password=os.getenv("POSTGRES_DB_PASSWORD", "mypassword"),
    )


def update_payroll_position(
    conn,
    internal_link: str,
    name: str,
    x: float,
    y: float,
    width: float,
    height: float,
    confidences: dict,
) -> int:
    """
    Update x, y, width, height and confidences for the payroll row that
    matches (internalLink, name).

    Returns the number of rows updated.
    """
    sql = """
        UPDATE payrolls
        SET x           = %s,
            y           = %s,
            width       = %s,
            height      = %s,
            confidences = %s
        WHERE "internalLink" = %s
          AND name = %s
    """
    params = (x, y, width, height, json.dumps(confidences), internal_link, name)

    with conn.cursor() as cur:
        cur.execute(sql, params)
        count = cur.rowcount
    conn.commit()
    return count
