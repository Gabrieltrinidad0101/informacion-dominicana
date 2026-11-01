# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**Información Dominicana** is a data pipeline + frontend that scrapes, processes, and visualizes payroll data from Dominican Republic government institutions. The backend is a set of independent, run-to-completion scripts (Node.js + one Python service) that run in sequence; the frontend is a React/Vite SPA that reads pre-built JSON straight from object storage.

There is no test suite, linter, or formatter configured.

## Running services

Node services run from the repo root (ES modules, `"type": "module"`). Each loads `.env` via `dotenv/config`.

```bash
npm install
npm run download -- <institutionKey> [--retry]   # institutionKey is REQUIRED here
npm run aiProcess -- [key] [--file <name>] [--page <n>] [--year <y>] [--month <m>] [--force] [--batch]
npm run insertData -- [key] [--year <y>] [--month <m>]
npm run pii -- [key] [--year <y>] [--month <m>] [--force]   # python3 ./projects/pii/main.py
npm run validateId -- [--year <y>] [--month <m>]            # no institution key; filters on payrolls.date
npm run exportToJson -- [key]
npm run minioToR2 -- [--force] [--prefix <prefix>]
npm run worldBank
node deleteR2.js [--prefix <p>] [--dry-run]                 # bulk-delete objects from the R2 bucket
```

Institution keys are the top-level keys of `projects/shared/institutions.json` (e.g. `ayuntamientoJarabacoa`, `intrant`). Omitting the key processes all institutions (except `download`, which exits with usage).

`npm run filesManager` and the `files_manager` compose service point at `projects/filesManager/`, which **does not exist** in the repo — they will fail.

### Frontend (`projects/frontend/`)

```bash
cd projects/frontend && npm install
npm run dev       # vite --host (http://localhost:5173)
npm run build     # → dist/
```

### Python PII service (`projects/pii/`)

```bash
cd projects/pii && pip install -r requirements.txt   # paddleocr, PyMuPDF, Pillow, psycopg2, boto3
cp .env.example .env
```

Note its defaults differ from Node: `ENDPOINT` defaults to `http://minio:9000` and `POSTGRES_HOST` to `postgres` (Docker hostnames), so set them to `localhost` when running on the host.

## Docker

`docker-compose.yml` defines every service plus `postgres:15` (5432, user `myuser`/`mypassword`, db `informacion-dominicana`) and MinIO (9000 API, 9001 console, creds literally `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD`). The build context for every service is `./projects`, and each dockerfile copies `shared/` plus its own folder.

```bash
docker compose up -d postgres minio
docker compose run --rm download node ./download/main.js <institutionKey>
```

## Architecture

### Storage path convention

Everything lives in MinIO bucket `informacion-dominicana-v2` (hardcoded in `shared/fileManagerClient.js`). The key encodes metadata, and the third segment is the pipeline stage that produced the file:

```
{institutionName}/{typeOfData}/{stage}/{year}/{month}/{filename}
```

Stages derive their keys by swapping the stage segment (`toAiPath`, pii's `replace_stage`). `parsePathMeta` splits keys positionally, so the segment order is load-bearing. Note that `institutionName` is the human-readable name (e.g. `Ayuntamiento de Jarabacoa`), not the registry key.

### Pipeline

```
download → aiProcess → insertData → pii → validateId → exportToJson → minioToR2
```

1. **download**: Puppeteer scrapes the institution's `link`, picks a scraper by `institutionType` from the `scrapers` map in `download/main.js` (`download/scrapers/*.js`), and uploads raw PDF/XLSX files to `.../download/...`. Failed links go to `download/errors-*.json` for `--retry`. `HEADLESS=false` shows the browser.
2. **aiProcess**: PDFs are handled by `pdf.js` (needs poppler: `pdfinfo`, `pdftoppm`, `pdftotext`).
   - `detectLayout` runs once per document on the first, middle and last pages. It decides whether a person's "Cargo:" line is on the same row, above the name, or below it (e.g. Las Charcas prints it above).
   - Each page is rendered to a 2576px JPEG, plus its text layer when it has one. The layer is only a hint, because some published PDFs carry a garbage OCR layer. Claude returns structured JSON with values as printed (prompts in `prompt.js`), and amounts are parsed in code (`incomeRaw` keeps the printed value). Each person comes back as an array of 9 strings rather than an object, including `sex` (only when printed) and `sexGuess` (from given names or a gendered position; stored with `sexInferred`). Repeating the keys for every person nearly doubled the output tokens, and a text separator like `|` is ambiguous because it does appear in source documents. `parseRows` rejects any row that doesn't have exactly 9 values; the page is then re-read once, and rows still malformed are kept as `malformedRow` for review.
   - Rotated pages are straightened and read again.
   - Label lines printed on a neighbouring page are attached to their person by `linkAcrossPages`, which can rewrite the previous page's JSON.
   - Lines carry `uncertain`, `needsReview` and, for pages with a text layer, `verifiedByTextLayer`.
   - Output goes to `.../aiProcess/.../<file>_page<N>.json` as `{ lines, page }`. Pages run sequentially because each page gets the previous page's context.
   - `--batch` sends PDFs through the Message Batches API instead (`batch.js`): half price, results within 24 h, and no previous-page context (the document layout is still sent). The run is a resumable state machine in `aiProcess/batches/state.json`; re-running `--batch` resumes it and ignores the new filters.
     - The steps are: discover pages, run layout detection per document, submit the pages, then submit a second round for rotated pages and pages with malformed rows.
     - Once every page of a document is answered, the document is finalized: cross-page labels are linked and the pages are written to MinIO.
     - Refusals and pages that fail 3 times are not written, so a normal run retries them (with server-side fallbacks, which batches don't allow).
     - Spreadsheets are still processed synchronously in batch mode.

   Spreadsheets (`SPREADSHEET_EXTENSIONS` in `excel.js`) are handled differently, and values are **never rewritten by a model**:
   - `spreadsheet.js` asks Claude (`llm.js`, structured JSON output) which column is which for each sheet layout. The model sees the header plus a few data rows, so misspelled or swapped labels and name/surname split across columns are resolved.
   - Mappings are cached by layout in `aiProcess/cache/columnMappings.json`. Header rows are stored relative to the detected header, because the title rows above it vary by month.
   - Every mapping is checked against the cell contents (`validateMapping`). Optional columns that don't fit are dropped, e.g. a card number mapped as cédula. If the model mapping fails, the rule-based `detectHeader` is used instead.
   - `excel.js` then reads the cells directly. The output is `{ lines, sheets }`, where each line also carries `incomeRaw`, `row` and `sheet`.
   - When a sheet has no sex column, sex is inferred from the first two given names (cached in `aiProcess/cache/firstNameSex.json`) and marked `sexInferred`. PDFs don't need this step, because the page request already returns `sexGuess`.

   Existing outputs are skipped unless `--force` is set, and failures are logged to `aiProcess/errors/<date>.json`. Source documents are not trustworthy (their totals can be wrong), so extraction copies what the document says; it never "corrects" the data.
3. **insertData**: reads the aiProcess JSON and inserts rows into the `payrolls` table. It also creates the table if missing (`ensureTable()`, which is the only schema definition; there are no migrations).
4. **pii** (Python): for each downloaded PDF, it extracts the embedded images to `images/`, runs PaddleOCR (`lang="es"`, orientation correction on, unwarping deliberately off so coordinates stay aligned) and writes the results to `extractedText/`. It also writes rotated images and metadata to `imgProcessed/` and a straightened PDF to `pdfFixed/`. `matcher.py` maps OCR boxes to payroll rows, and `db.py` updates `x/y/width/height/confidences` on the rows matched by `internalLink` + `name`. Coordinates are in PDF points (`pixels * 72 / RENDER_DPI`).
5. **validateId**: calls `VALIDATE_ID_NUMBER_API/<digits>/validate` for each `payrolls.document` and sets `isDocumentValid`.
6. **exportToJson**: aggregates `payrolls` into chart JSON under `{institutionName}/nomina/exportToJson/`. The output files are `payroll.json`, `employeersM/F/Total.json`, `employeersByPosition*.json`, `percentageOfSpendingByPosition*.json` and `header.json`.
7. **minioToR2**: mirrors MinIO to Cloudflare R2 (skips existing objects unless `--force`). Its `R2_BUCKET` defaults to `informaciondominicana`.

`worldBank` is independent of the payroll pipeline: it downloads World Bank indicators, parses the XML, and writes JSON to MinIO for `WorldBankPage`.

### Shared modules (`projects/shared/`)

- `institutions.json` is the **single institution registry**, read by the Node services (via `institutions.js`), by pii (it only processes entries with `"pii": true`) and by the frontend (`src/utils/institutionNames.js`, which only shows entries with `"frontend": true`, keyed by `slug`). Vite's `server.fs.allow: ['..']` makes that import work.
- `institutions.js` is a thin fs-based loader for the JSON file.
- `fileManagerClient.js` is the S3 client for MinIO (env `ENDPOINT`, default `http://localhost:9000`; `REGION`). pii has a Python equivalent in `pii/file_manager.py`.
- `db.js` exports `createKnex()`, the shared Postgres connection for Node services (`POSTGRES_*` env vars, with defaults that match docker-compose).

To add an institution, add an entry to `institutions.json`. If its `institutionType` is new, also add a scraper in `download/scrapers/` and register it in the `scrapers` map in `download/main.js`. For the frontend, also set `slug`/`frontend` and add a `PAGE_TITLES` entry in `src/App.jsx`.

### Frontend

React 18 + react-router 7 + Vite. `src/App.jsx` lazy-loads `PresentationPage`, `InstitutionPayroll`, `Analytics` and `WorldBankPage`. The UI text is in Spanish. There is no backend API: `src/utils/request.js` (`requestJson`) and `src/utils/fileUrl.js` fetch files directly from `VITE_SERVER_URL` (default `http://localhost:9000/informacion-dominicana-v2`, the public MinIO bucket; in production it is R2). `requestJson` sanitizes the last path segment (strips accents and replaces non-`[A-Za-z0-9._-]` characters with `_`) and appends `.json`. Source-document links use `urlDownload`: a `_pageN` suffix means a page of a PDF, otherwise the Excel extension is probed.

## Environment variables (`.env` at repo root)

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude (aiProcess: PDF extraction, spreadsheet column mapping, sex inference) |
| `VALIDATE_ID_NUMBER_API` | Cedula validation endpoint base |
| `CHROMIUM_PATH` / `HEADLESS` | Puppeteer binary (default `/usr/bin/chromium`) / headful mode |
| `ENDPOINT` / `REGION` / `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | MinIO |
| `POSTGRES_DB_USER` / `POSTGRES_DB_PASSWORD` / `POSTGRES_HOST` / `POSTGRES_PORT` / `POSTGRES_DB` | PostgreSQL |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` | Cloudflare R2 |
| `VITE_SERVER_URL` | Frontend base URL for data files |

## Sensitive data

The pii service handles real personal data. `projects/pii/output/`, `projects/pii/tmp/` and the pii `*.png`/`*.pdf`/`errors-*.json` files are gitignored on purpose, so do not commit OCR artifacts.
