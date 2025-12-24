export const propt = (data) => `"""Convert the given OCR-extracted text into a JSON array following this structure:

Example Output:
{
  "name": "Gabriel",
  "document": "050-9999999-9",
  "position": "MUSICIAN",
  "income": "2645",
  "sex": "M",
  "x": 10,
  "y": 10,
  "width": 1000,
  "height": 43,
  "confidences": [0.9, 0.8, 0.7,0.95]
}

Extraction Rules:
  - Based on the text position, group the text line by line.
  - Get all the score values for each word and set into scores array.
  - Each object represents either an individual or an institutional entry.
  - Add the confidence for name, document, position, and income to confidences.
  - For individuals:
    - Include \`name\`, \`position\`, \`income\`, and \`sex\` (M/F) where available.
    - income can be \`Honorífico\`.
    - Omit \`document\` and \`sex\` if unavailable.
    - Include bounding box: \`x\`, \`y\`, \`width\`, \`height\` of the line containing the main record.
  - Combine multi-line text blocks if a single logical entry spans several lines.
  - Remove or replace any internal \`"\` characters inside values with \`'\`.
  - Fix numbers and clean OCR artifacts:
    - Remove extra trailing zeros after the decimal or comma. Examples:
        12,00000 → 12000
        120,00000 → 120000
    - Remove redundant decimals or commas and unify formatting:
        10,000.00 → 10000
        10,00000 → 10000
        12,000.00 → 12000
        9.000.00 → 9000
    - Correct OCR misreads of symbols within numbers (like £, ¥, or spaces) and interpret as intended numeric value:
        3,7£3.60 → 3104.60

**CRITICAL: POSITION NORMALIZATION & TEXT CLEANING**
  - Before creating the JSON, normalize all \`position\` values and correct encoding errors in the text.
  - **Encoding/Typo Correction:** Fix common OCR/encoding errors (e.g., \`TÃ% CNICO\` -> \`TÉCNICO\`, \`ALCALDÃ•A\` -> \`ALCALDÍA\`, \`Ã‘\` -> \`Ñ\`).
  - **Position Normalization Rules:**
    - Convert all variants of a position to a single, standardized term.
    - **Gendered Terms:** Standardize to the masculine singular form (e.g., \`regidora\`/\`regidores\` -> \`regidor\`, \`abogada\` -> \`abogado\`, \`presidenta\` -> \`presidente\`).
    - **Group/Department Names:** Apply the same normalization to the role within a group name (e.g., \`cuerpo de bomberas\` -> \`cuerpo de bombero\`). The final \`position\` value for the entry should be the normalized role (e.g., \`bombero\`).

**Filtering Rule:**
  - If the text does **not** represent a valid person or institution, do **not** include it in the JSON output.
  - Output should be **strictly valid JSON**, as a list of objects, with no explanations.
"""

${data}
`