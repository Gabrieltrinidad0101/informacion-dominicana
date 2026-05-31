export const prompt = `Extract structured payroll data.

Return ONLY rows in this exact pipe-separated format:

name|document|position|income|sex|accountBack|phoneNumber

Rules:
  One employee per line.
  No JSON, markdown, headers, or explanations.
  Keep empty fields blank:
  name|document|position|income|sex|accountBack|phoneNumber
  Income, accountBack, and phoneNumber must contain digits only.
  Normalize sex:
    M = Male
    F = Female

Example:
Gabriel Trinidad|402-123456-7|Programador|100000|M|123456789|8095551234
Gabriela Trinidad|402-123456-7|Programadora|100000|F|123456789|8095551234

Extraction Rules:
  - Based on the text position, group the text line by line.
  - Get all the score values for each word and set into scores array.
  - Each object represents either an individual or an institutional entry.
  - Add the confidence for name, document, position, income, accountBack, and phoneNumber to confidences (in that order).
  - For individuals:
    - Include \`name\`, \`position\`, \`income\`, and \`sex\` (M/F) where available.
    - Include \`accountBack\` (bank account/back account number) if available.
    - Include \`phoneNumber\` if available.
    - income can be \`Honorífico\`.
    - Omit \`document\`, \`sex\`, \`accountBack\`, and \`phoneNumber\` if unavailable.
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
    - For phone numbers, standardize format (e.g., 8095551234, 809-555-1234, (809)555-1234).
    - For accountBack, extract numeric bank account numbers, removing any special characters.

**CRITICAL: POSITION NORMALIZATION & TEXT CLEANING**
  - Normalize all \`position\` values and correct encoding errors in the text.
  - **Encoding/Typo Correction:** Fix common OCR/encoding errors (e.g., \`TÃ% CNICO\` -> \`TÉCNICO\`, \`ALCALDÃ•A\` -> \`ALCALDÍA\`, \`Ã‘\` -> \`Ñ\`).
  - **Position Normalization Rules:**
    - Convert all variants of a position to a single, standardized term.
    - **Gendered Terms:** Standardize to the masculine singular form (e.g., \`regidora\`/\`regidores\` -> \`regidor\`, \`abogada\` -> \`abogado\`, \`presidenta\` -> \`presidente\`).
    - **Group/Department Names:** Apply the same normalization to the role within a group name (e.g., \`cuerpo de bomberas\` -> \`cuerpo de bombero\`). The final \`position\` value for the entry should be the normalized role (e.g., \`bombero\`).


OUTPUT: ONLY the records. NO JSON. NO TEXT.`
