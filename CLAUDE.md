# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Información Dominicana** scrapes, processes, and publishes Dominican government transparency data (payrolls). It downloads PDFs/Excel files from government websites, uses AI to extract structured data, stores it in PostgreSQL, and serves it via a Docusaurus frontend.

## Data Pipeline

The `reBuild` branch replaces the old RabbitMQ event-driven pipeline with direct CLI scripts that read/write from MinIO:

```
download → aiProcess → insertData
```

Run each stage manually (invoke directly, the npm scripts in package.json point to a non-existent path):

```bash
node projects/download/main.js <institutionKey> [--retry]
# Downloads PDFs/Excel from institution website → MinIO at {institutionName}/{typeOfData}/download/...

node projects/aiProcess/main.js [institutionKey] [--file <name>] [--page <n>] [--year <year>] [--month <month>] [--force]
# Reads from download/ in MinIO, runs AI, writes JSON to aiProcess/ in MinIO

node projects/insertData/main.js [institutionKey]
# Reads from aiProcess/ in MinIO, upserts records into PostgreSQL payrolls table
```

`institutionKey` values are defined in `projects/shared/institutions.js` (e.g., `ayuntamientoJarabacoa`).

### AI providers

`aiProcess` uses two AI providers depending on file type:
- **PDFs** → Anthropic Claude API (`claude-sonnet-4-6`) via `ANTHROPIC_API_KEY`
- **Excel (.xlsx/.xls)** → DeepSeek API via `API_AI_KEY`

### File Storage Path Convention

MinIO bucket: `informacion-dominicana-v2`  
Path: `{institutionName}/{typeOfData}/{microService}/{year}/{month}/{filename}`  
`aiProcess` converts download paths via `fileManagerClient.toAiPath()`: replaces `/download/` → `/aiProcess/` and extension → `.json`. For PDFs, page index is appended: `file_page0.json`.

### Shared Libraries (`projects/shared/`)

- `fileManagerClient.js` — `FileManagerClient` class wrapping AWS SDK S3. Key methods: `uploadFileFromUrl`, `getFile`, `listFiles`, `fileExists`, `createTextFile`, `toAiPath(downloadKey)`, `parsePathMeta(key)`.
- `institutions.js` — Registry of all target institutions with `link`, `institutionName`, `institutionType`, `typeOfData`. Add new institutions here to include them in the pipeline.

## Other Services

| Service | Language | Role |
|---|---|---|
| `exportToJson` | Node.js | Exports aggregated stats to MinIO as JSON |
| `filesManager` | Node.js (port 4000) | HTTP proxy for MinIO files |
| `worldBank` | Node.js | World Bank data source (separate pipeline) |
| `pii` | Python | PII handling |
| `validateId` | Node.js | Dominican national ID validation |
| `frontend` | Docusaurus | Public-facing data visualization site |

```bash
npm run filesManager        # File proxy server (port 4000)
npm run frontend            # Docusaurus site
npm run worldBank
npm run exportToJson
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
- **Scraper registry**: `download/main.js` maps `institution.institutionType` to a scraper function. Add new scrapers to `projects/download/scrapers/` and register them in the `scrapers` map.
- **CI/CD**: `build-changed-services.sh` diffs `HEAD~1..HEAD`, builds only changed service Docker images, pushes to `ghcr.io/gabrieltrinidad0101/informacion-dominicana-{service}:latest`, and triggers Dokploy webhooks.
