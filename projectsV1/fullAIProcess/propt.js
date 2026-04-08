export const propt = () => `"""Extract structured data from OCR text.

OUTPUT FORMAT (STRICT):
Return a list of records using this compact format:

name|document|position|income|sex|accountBack|phoneNumber

RULES:
- One record per line.
- Use "|" as field separator.
- Use "," for confidences.
- If a field is missing, leave it empty (e.g., ||).
- Do NOT output JSON.
- Do NOT add explanations.

EXAMPLE:
Gabriel|05099999999|musician|2645|M|1234567890|8095551234

EXTRACTION:
- Group text line by line based on position.
- Combine multi-line entries when needed.
- Each line = one person or institution.

CLEANING:
- Fix OCR encoding errors (e.g., TÃ% CNICO → TÉCNICO).
- Normalize positions:
  - Use masculine singular (regidora → regidor).
  - Normalize roles inside groups (bomberos → bombero).

NUMBERS:
- Normalize numbers:
  - 10,000.00 → 10000
  - 9.000.00 → 9000
  - Remove noise symbols (£, ¥, spaces).
- income can be "Honorífico".

PHONE:
- Normalize to digits only (8095551234).

ACCOUNT:
- Keep only numeric characters.

FILTER:
- Ignore lines that are not valid persons or institutions.

OUTPUT:
- ONLY the records.
- NO JSON.
- NO TEXT.
"""`;