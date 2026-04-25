# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Información Dominicana** scrapes, processes, and publishes Dominican government transparency data (payrolls). It downloads PDFs/Excel files from government websites, uses AI to extract structured data, stores it in PostgreSQL, and serves it via a Vite + React SPA frontend.

## Data Pipeline

The `reBuild` branch uses direct CLI scripts that read/write from MinIO:

```
download → aiProcess → insertData → exportToJson
```

All scripts live under `projects/` and are run from that directory:

```bash
node projects/download/main.js <institutionKey> [--retry]
# Scrapes institution site with Puppeteer → uploads PDFs/Excel to MinIO at:
# {institutionName}/{typeOfData}/download/{year}/{month}/{filename}

node projects/aiProcess/main.js [institutionKey] [--file <name>] [--page <n>] [--year <year>] [--month <month>] [--force]
# Reads from download/ in MinIO, runs AI extraction, writes JSON to aiProcess/ in MinIO

node projects/insertData/main.js [institutionKey]
# Reads from aiProcess/ in MinIO, upserts records into PostgreSQL payrolls table

node projects/exportToJson/main.js [institutionKey]
# Queries PostgreSQL and writes aggregated stats JSON to MinIO at:
# {institutionName}/nomina/exportToJson/{filename}.json
```

`institutionKey` values are defined in `projects/shared/institutions.js` (e.g., `ayuntamientoJarabacoa`).

### AI providers

`aiProcess` uses two AI providers depending on file type:
- **PDFs** → Anthropic Claude API (`claude-sonnet-4-6`) via `ANTHROPIC_API_KEY`. Each page is extracted as a separate JSON file.
- **Excel (.xlsx/.xls)** → DeepSeek API (`deepseek-chat`) via `API_AI_KEY`. Processed in 200-row chunks.

Both providers use the same pipe-delimited prompt (`aiProcess/prompt.js`) that returns records as `name|document|position|income|sex|accountBack|phoneNumber`.

### File Storage Path Convention

MinIO bucket: `informacion-dominicana-v2`  
Path: `{institutionName}/{typeOfData}/{microService}/{year}/{month}/{filename}`  
`aiProcess` converts download paths via `fileManagerClient.toAiPath()`: replaces `/download/` → `/aiProcess/` and extension → `.json`. For PDFs, page index is appended: `file_page0.json`.

### Shared Libraries (`projects/shared/`)

- `fileManagerClient.js` — `FileManagerClient` class wrapping AWS SDK S3. Key methods: `uploadFileFromUrl`, `getFile`, `listFiles`, `fileExists`, `createTextFile`, `toAiPath(downloadKey)`, `parsePathMeta(key)`.
- `institutions.js` — Registry of all target institutions with `link`, `institutionName`, `institutionType`, `typeOfData`. Add new institutions here to include them in the pipeline.

## Scraper Architecture

`download/main.js` maps `institution.institutionType` → scraper function. Add new scrapers to `projects/download/scrapers/` and register in the `scrapers` map.

Most scrapers delegate to `scrapers/scrapeYearMonthFiles.js`, a shared helper that navigates a year → month → file hierarchy using CSS selectors passed per institution. The selectors for year folders, month folders, and download links differ per institution type. Scrapers that use it: `townHall.js`, `intrant.js`, `digesett.js`, `optic.js`.

`--retry` mode reads `download/errors-{institutionKey}.json` (written when downloads fail) instead of re-scraping.

## Frontend (`projects/frontend/`)

Vite + React SPA. Reads data exclusively from `filesManager` (port 4000), which proxies MinIO.

**Data flow**: `exportToJson` → MinIO → `filesManager` (port 4000 HTTP proxy) → frontend.

**Pages:**
- `/` — `PresentationPage` (landing)
- `/:institution` (jarabacoa, moca, cotui, intrant, ogtic) — `InstitutionPayroll`: payroll charts + employee table + drawer
- `/economia`, `/social`, `/salud`, `/educacion`, `/medioambiente`, `/militar` — `WorldBankPage`: World Bank indicators by category
- `/fuentes` — `Analytics`: data sources

**Key architecture notes:**
- `App.jsx` owns routing, theme (CSS vars `--accent`, `data-theme`), and density state. Passes `accent` prop down to pages.
- `fetchInstitutionData.js` (`utils/`) has its own `INSTITUTION_NAMES` mapping (short key → display name) that must stay in sync with `shared/institutions.js` when adding institutions.
- `filesManager` at port 4000 is required for the frontend to load any data.

## Other Services

| Service | Language | Role |
|---|---|---|
| `filesManager` | Node.js (port 4000) | HTTP proxy for MinIO files |
| `worldBank` | Node.js | World Bank data source (separate pipeline) |
| `pii` | Python | PII handling |
| `validateId` | Node.js | Dominican national ID validation |

```bash
# Run from projects/
node projects/filesManager/main.js   # File proxy server (port 4000)
node projects/worldBank/main.js
node projects/exportToJson/main.js
cd projects/frontend && npm run dev  # Vite dev server
```

### Docker (via Makefile)
```bash
make all        # docker compose up -d
make build      # docker compose build
make rebuild    # docker compose build --no-cache
make down       # docker compose down
make <service>  # build + start single service
make projects   # start only grafana/promtail/loki
```

### Tests
```bash
npm test                   # Vitest — runs projects/test/
npm run postDownload-test  # postDownload-specific tests
```

### CI/CD
```bash
./build-changed-services.sh    # Build + push only git-changed services to ghcr.io
```

## Environment Variables

- `ANTHROPIC_API_KEY` — Claude API key for PDF processing in `aiProcess`
- `API_AI_KEY` — DeepSeek API key for Excel processing in `aiProcess`
- `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` — MinIO credentials (defaults: `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD`)
- `ENDPOINT` — MinIO endpoint (default: `http://localhost:9000`)
- `REGION` — S3 region (default: `us-east-1`)
- `POSTGRES_DB_USER`, `POSTGRES_DB_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_DB` — PostgreSQL connection (defaults: `myuser`/`mypassword`/`localhost`/`informacion-dominicana`)
- `CHROMIUM_PATH` — Puppeteer browser path (default: `/usr/bin/chromium`)
- `PACKAGE_TOKEN` — GitHub Container Registry token (CI/CD only)
- `DOKPLOY_{SERVICE}_WEBHOOK` — Dokploy deployment webhook per service

Each service has its own `.env` file loaded via `dotenv`.

## Infrastructure (docker-compose.yml)

| Service | Purpose | Port |
|---|---|---|
| PostgreSQL | Relational storage | 5432 |
| MinIO | S3-compatible file storage | 9000, 9001 (console) |
| Loki + Promtail + Grafana | Log aggregation | 3100, 5000 |

## Key Patterns

- **ES Modules**: All JS services use `"type": "module"` and `.js` extensions in imports.
- **Monorepo workspaces**: Root `package.json` uses npm workspaces (`"workspaces": ["projects/*"]`).
- **Idempotency**: Both `aiProcess` and `insertData` skip already-processed files unless `--force` is passed. `insertData` deletes existing rows for the same `(date, institutionName, internalLink)` before re-inserting.
- **CI/CD**: `build-changed-services.sh` diffs `HEAD~1..HEAD`, builds only changed service Docker images, pushes to `ghcr.io/gabrieltrinidad0101/informacion-dominicana-{service}:latest`, and triggers Dokploy webhooks.
