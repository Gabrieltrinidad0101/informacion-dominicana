export const prompt = `Extract structured payroll data.

OUTPUT FORMAT (STRICT):
Return records in this pipe-separated format, one per line:

name|document|position|income|sex|accountBack|phoneNumber

RULES:
- One record per line.
- Use "|" as field separator.
- If a field is missing, leave it empty (e.g., ||).
- Do NOT output JSON, markdown, or explanations.

EXAMPLE:
Gabriel|05099999999|musician|2645|M|1234567890|8095551234

CLEANING:
- Fix OCR/encoding errors (e.g., TÃ%CNICO → TÉCNICO).
- Normalize positions to masculine singular (regidora → regidor).
- Normalize income numbers: 10,000.00 → 10000, remove symbols (£, ¥).
- income can be "Honorífico".
- Normalize phones to digits only (8095551234).
- Keep account numbers digits only.
- Ignore lines that are not valid persons.

OUTPUT: ONLY the records. NO JSON. NO TEXT.`
