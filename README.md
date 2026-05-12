# Información Dominicana

A data pipeline and frontend that scrapes, processes, and visualizes public payroll data from Dominican Republic government institutions, making government transparency data accessible to everyone.

## How it works

Raw payroll files (PDF/XLSX) are scraped from official transparency portals, extracted with AI (Claude for PDFs, DeepSeek for Excel), stored in PostgreSQL, and served as pre-built JSON files to a React frontend.

Pipeline stages run in order:

```
download → aiProcess → insertData → pii → validateId → exportToJson → minioToR2
```

Files are stored in MinIO with a path structure that encodes metadata:
```
{institutionName}/{typeOfData}/{pipelineStage}/{year}/{month}/{filename}
```

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Python 3.10+ (for the `pii` service only)

## Quick start

```bash
# 1. Clone and install
git clone <repo-url>
cd informacion-dominicana
npm install

# 2. Copy and fill in environment variables
cp .env.example .env   # set ANTHROPIC_API_KEY, API_AI_KEY, etc.

# 3. Start infrastructure
docker compose up -d postgres minio

# 4. Run the pipeline for a specific institution
npm run download -- ayuntamientoJarabacoa
npm run aiProcess -- ayuntamientoJarabacoa
npm run insertData -- ayuntamientoJarabacoa
npm run exportToJson -- ayuntamientoJarabacoa

# 5. Start the file proxy and frontend
npm run filesManager &
cd projects/frontend && npm install && npm run dev
```

## Environment variables

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key (PDF extraction) |
| `API_AI_KEY` | DeepSeek API key (Excel extraction) |
| `VALIDATE_ID_NUMBER_API` | Government cedula validation endpoint |
| `CHROMIUM_PATH` | Path to Chromium binary (default: `/usr/bin/chromium`) |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | MinIO credentials |
| `POSTGRES_DB_USER` / `POSTGRES_DB_PASSWORD` / `POSTGRES_HOST` / `POSTGRES_DB` | PostgreSQL connection |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` | Cloudflare R2 (production sync) |

## Adding a new institution

1. Add an entry to `projects/shared/institutions.js` with the scraper URL, institution name/type, and data category.
2. Create a scraper in `projects/download/scrapers/` that matches the `institutionType`.
3. Register the scraper in the `scrapers` map in `projects/download/main.js`.

## Services

| Service | Command | Description |
|---|---|---|
| download | `npm run download [key] [--retry]` | Puppeteer scraper — downloads PDFs/XLSXes to MinIO |
| aiProcess | `npm run aiProcess [key] [--force] [--year y] [--month m] [--file f] [--page n]` | AI extraction to structured JSON |
| insertData | `npm run insertData [key]` | Loads AI JSON into PostgreSQL `payrolls` table |
| pii | `npm run pii [key] [--year y] [--file f]` | OCR bounding-box extraction + redaction (Python) |
| validateId | `npm run validateId [--year y] [--month m]` | Validates cedula numbers against government API |
| exportToJson | `npm run exportToJson [key]` | Exports aggregated chart data back to MinIO |
| minioToR2 | `npm run minioToR2 [--force] [--prefix p]` | Syncs MinIO → Cloudflare R2 for production |
| filesManager | `npm run filesManager` | Express proxy for MinIO files (port 4000) |
| worldBank | `npm run worldBank` | Downloads and processes World Bank data |

## Docker

```bash
docker compose up -d postgres minio        # infrastructure only
docker compose run --rm download           # run one service
docker compose up --build                  # full stack
```

MinIO console: http://localhost:9001

## Frontend

React 18 + Vite SPA in `projects/frontend/`.

```bash
cd projects/frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
```

Pages: institution payroll explorer, cross-institution analytics, World Bank data visualizations.

## Contributing

Issues and pull requests are welcome at [github.com/Gabrieltrinidad0101/informacion-dominicana/issues](https://github.com/Gabrieltrinidad0101/informacion-dominicana/issues).
