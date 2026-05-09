# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**Información Dominicana** is a data pipeline + frontend that scrapes, processes, and visualizes payroll data from Dominican Republic government institutions. The backend is a collection of independent microservices (Node.js + one Python service) that run in sequence; the frontend is a React/Vite SPA.

## Running microservices

All Node.js services are run from the project root (where `package.json` lives). The project uses ES modules (`"type": "module"`).

```bash
# Install root dependencies
npm install

# Run individual services
npm run download        # scrapes + downloads files to MinIO
npm run aiProcess       # AI extraction (Claude API for PDF, DeepSeek for Excel)
npm run insertData      # inserts AI results into PostgreSQL
npm run exportToJson    # aggregates DB data and writes JSON back to MinIO
npm run validateId      # validates cedula numbers against the government API
npm run pii             # Python: OCR + bounding-box extraction + redaction
npm run filesManager    # Express proxy for MinIO files (port 4000)
npm run minioToR2       # syncs MinIO bucket → Cloudflare R2
npm run worldBank       # downloads and processes World Bank data

# Frontend (inside projects/frontend/)
cd projects/frontend && npm install
npm run dev             # dev server with HMR
npm run build           # production build into dist/
```

## Docker

Each microservice has its own `dockerfile` under `projects/<service>/`. The root `docker-compose.yml` orchestrates all services plus PostgreSQL (`postgres:15`, port 5432) and MinIO (ports 9000/9001).

```bash
docker compose up -d postgres minio          # start infrastructure
docker compose run --rm download             # run a single service
docker compose up --build                    # rebuild and run everything
```

MinIO console: http://localhost:9001 (default creds: `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`)

## Architecture: data pipeline flow

Files are stored in MinIO bucket `informacion-dominicana-v2` using a path convention that encodes metadata:

```
{institutionName}/{typeOfData}/{microservice}/{year}/{month}/{filename}
```

The pipeline stages map directly to that path segment:

1. **download** — scrapes institution transparency pages with Puppeteer, stores raw PDFs/XLSXes under `.../download/...`
2. **aiProcess** — reads from `.../download/...`, extracts structured payroll lines via Claude API (PDF) or DeepSeek (Excel), writes JSON to `.../aiProcess/...`
3. **insertData** — reads `.../aiProcess/...` JSON, upserts records into the `payrolls` PostgreSQL table
4. **pii** (Python) — reads `.../aiProcess/...` + source PDFs, runs PaddleOCR to locate each field's bounding box, updates `x/y/width/height/confidences` columns in `payrolls`, uploads redacted PDFs to `.../pii/...`
5. **validateId** — queries `payrolls` and calls the government cedula validation API to set `isDocumentValid`
6. **exportToJson** — queries `payrolls` and writes aggregated chart-ready JSON to `.../exportToJson/...`
7. **minioToR2** — mirrors the final MinIO contents to Cloudflare R2 for production serving

## Shared modules

- `projects/shared/fileManagerClient.js` — S3-compatible client wrapping all MinIO I/O (upload, download, exists check, list, path conversions). Used by every Node.js service.
- `projects/shared/institutions.js` — registry of institutions: scraper URL, name, type, and data category. Adding a new institution requires an entry here and a matching scraper in `projects/download/scrapers/`.

## Key environment variables (`.env`)

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API (PDF extraction in aiProcess) |
| `API_AI_KEY` | DeepSeek API (Excel extraction in aiProcess) |
| `VALIDATE_ID_NUMBER_API` | Government cedula validation endpoint |
| `CHROMIUM_PATH` | Chromium binary for Puppeteer (default `/usr/bin/chromium`) |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | MinIO credentials |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` | Cloudflare R2 sync |
| `POSTGRES_DB_USER` / `POSTGRES_DB_PASSWORD` / `POSTGRES_HOST` / `POSTGRES_DB` | PostgreSQL connection |

## CLI flags for microservices

Most services accept an optional institution key as the first positional argument (from `shared/institutions.js`). If omitted, all institutions are processed.

| Service | Extra flags |
|---|---|
| `download` | `--retry` (retry previously failed downloads) |
| `aiProcess` | `--file <name>`, `--page <n>`, `--year <y>`, `--month <m>`, `--force` |
| `insertData` | none beyond institution key |
| `exportToJson` | none beyond institution key |
| `pii` | `--file <name>`, `--year <y>` |
| `validateId` | `--year <y>`, `--month <m>` |
| `minioToR2` | `--force`, `--prefix <prefix>` |

## Frontend

React 18 + Vite SPA in `projects/frontend/`. Routes:
- `PresentationPage` — landing/overview
- `InstitutionPayroll` — per-institution payroll explorer (fetches JSON from MinIO/R2 via `filesManager` proxy or direct R2 URL)
- `Analytics` — cross-institution analytics
- `WorldBankPage` — World Bank data visualizations

Data is fetched from exported JSON files (not from a live API), using `src/utils/fetchInstitutionData.js` and `src/utils/fileUrl.js`. The `filesManager` Express service (port 4000) acts as a local proxy to stream MinIO files to the frontend during development.

## Python PII service

Located in `projects/pii/`. Requires `paddleocr`, `PyMuPDF` (`fitz`), `Pillow`, and `psycopg2`. Dependencies in `requirements.txt`. Has its own `.env.example`.

```bash
cd projects/pii
pip install -r requirements.txt
python main.py [institutionKey] [--file <filename>] [--year <year>]
```
