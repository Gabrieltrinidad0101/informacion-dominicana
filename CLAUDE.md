# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Información Dominicana** is an event-driven microservices platform that scrapes, processes, and publishes Dominican government transparency data (payrolls, etc.). It downloads PDFs from government websites, runs OCR, uses AI to extract structured data, stores it in PostgreSQL/MongoDB, and serves it via a Docusaurus frontend.

## Commands

### Running services locally (with hot reload via nodemon)
```bash
npm run downloadLinks       # Scrape institution links
npm run download            # Download PDFs
npm run postDownload        # Convert PDF → images/text (JS version)
npm run extractedText       # OCR (Python, run via Docker)
npm run extractedTextAnalyzer
npm run textAnalysisAI      # AI parsing via DeepSeek
npm run insertData          # Insert structured data to DB
npm run exportToJson        # Export DB data to MinIO JSON
npm run filesManager        # File proxy server (port 4000)
npm run events              # Event tracking API (port 3001)
npm run frontend            # Docusaurus site
npm run auth
npm run uploadFiles
```

### Running services in production (no nodemon)
Replace the script name with `<service>-pro`, e.g.:
```bash
npm run download-pro
npm run postDownload-pro
```

### Tests
```bash
npm test                        # Run all vitest tests in projects/test/
npm run postDownload-test       # Run postDownload-specific tests
```
Tests run via **Vitest**. The integration test in `projects/test/happyPath.test.js` requires a running RabbitMQ and MinIO (use Docker). Tests use `eventBus.testMode = true` and bind to prefixed test queues (e.g., `testDownload`). Use a Promise/resolver pattern to await async pipeline events. Timeout: 60s.

### Docker (via Makefile)
```bash
make all                  # docker compose up -d (all services)
make build                # docker compose build
make rebuild              # docker compose build --no-cache
make down                 # docker compose down
make restart              # docker compose restart
make <service>            # Build and start a single service, e.g.: make download
make removeDownload       # docker compose down download
make projects             # Start only grafana/promtail/loki
```

Individual Docker services: `download`, `downloadLinks`, `events`, `frontend`, `postDownload`, `extractedText`, `extractedTextAnalyzer`, `aiTextAnalyzer`, `insertData`, `exportToJson`, `filesManager`.

### CI/CD
```bash
./build-changed-services.sh    # Builds and pushes only git-changed services to ghcr.io
```

## Architecture

### Data Pipeline (event-driven via RabbitMQ)

```
downloadLinks → download → postDownload → extractedText → extractedTextAnalyzer → aiTextAnalyzer → insertData → exportToJson
```

Each service listens on a RabbitMQ exchange and emits to the next. The `events` service tracks progress/failures and supports re-execution.

### Services

| Service | Language | Role |
|---|---|---|
| `downloadLinks` | Node.js | Scrapes institution website links |
| `download` | Node.js | Downloads PDFs from government sites |
| `postDownload` / `postDownloadPy` | JS + Python | Converts PDFs to images and raw text |
| `extractedText` | Python (PaddleOCR) | OCR on images |
| `extractedTextAnalyzer` | Node.js | Analyzes OCR output |
| `aiTextAnalyzer` | Node.js | Uses DeepSeek AI to parse payroll data |
| `insertData` | Node.js | Inserts structured records into PostgreSQL/MongoDB |
| `exportToJson` | Node.js | Exports aggregated stats to MinIO as JSON |
| `events` | Node.js (Express, port 3001) | Event tracking, re-execution API |
| `filesManager` | Node.js (Express, port 4000) | HTTP proxy for MinIO files |
| `worldBank` | Node.js | World Bank data source (separate pipeline) |
| `pII` | Python | PII handling |
| `auth` | Node.js | Authentication |
| `uploadFiles` | Node.js | File upload |
| `apigetway` | Node.js | API gateway |
| `frontend` | Docusaurus | Public-facing data visualization site |
| `admin` | Node.js | Admin interface |

> **Naming note**: Docker Compose service names use underscores (`download_links`, `post_download`); npm scripts and directory names use camelCase (`downloadLinks`, `postDownload`). `service-path-map.sh` maps between them for CI/CD.

### Shared Libraries (imported directly by path across services)

- `projects/eventBus/eventBus.js` — RabbitMQ wrapper (JS). Handles fanout exchanges, dead-letter retry queues (`_try` suffix), and ack/nack. Max 3 retries with 5s TTL. Tracks `traceId` across events.
- `projects/eventBusPy/eventBus.py` — Python equivalent using `pika`.
- `projects/fileManagerClient/main.js` — S3/MinIO client (AWS SDK). Provides upload, download, stream, and URL generation. Key method: `generateUrl(data, microService, fileName)` → `{institutionName}/{typeOfData}/{microService}/{year}/{month}/{filename}`.
- `projects/fileManagerClientPy/fileManagerClient.py` — Python equivalent.

### Infrastructure (docker-compose.yml)

| Service | Purpose | Port |
|---|---|---|
| RabbitMQ | Message broker | 5672, 15672 (management UI) |
| MongoDB | Document storage | 27017 |
| PostgreSQL | Relational storage | 5432 |
| MinIO | S3-compatible file storage | 9000, 9001 (console) |
| Loki + Promtail + Grafana | Log aggregation | 3100, 5000 |

### Events Service REST API (port 3001)

| Method | Path | Description |
|---|---|---|
| `GET` | `/events` | Health check |
| `GET` | `/events/find` | Query events (supports filter params) |
| `GET` | `/events/stats?exchangeName={name}` | Get counts: pending/inProgress/completed/withErrors |
| `POST` | `/events/reExecuteEvents` | Re-queue failed events |
| `DELETE` | `/events/deleteEvents` | Delete events by query |

Listens on all pipeline exchanges and stores lifecycle state in MongoDB: `startDate` → `progressDate` → `completedDate`. On startup, loads `defaultEvents.json` via `insertDefaultValues()`.

### Event Message Schema

Events carry a `traceId` (UUID), `exchangeName`, `institutionName`, `typeOfData`, `year`, `month`, and service-specific fields. The `events` service tracks `progressDate` and `completedDate` per event.

Special message headers control execution:
- `force` — bypass deduplication checks
- `typeOfExecute` — `onlyOne` or `onlyOneAndNext` to limit execution scope

### File Storage Path Convention

MinIO paths follow: `{institutionName}/{typeOfData}/{microService}/{year}/{month}/{filename}`
Example: `Test/nomina/postDownloads/2025/diciembre/_.16.jpg`

## Environment Variables

- `RABBITMQ_USER`, `RABBITMQ_PASSWORD` — defaults: `admin`/`admin`
- `MONGO_INITDB_ROOT_USERNAME`, `MONGO_INITDB_ROOT_PASSWORD` — defaults: `root`/`root`
- `MONGO_DB_USER`, `MONGO_DB_PASSWORD` — runtime connection credentials (defaults: `root`/`root`)
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` — defaults: `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD`
- `ENDPOINT` — MinIO endpoint, default `http://minio:9000`
- `REGION` — S3 region, default `us-east-1`
- `API_AI_KEY` — DeepSeek API key for `aiTextAnalyzer`
- `ENCRYPTION_KEY` — encrypts sensitive fields in `aiTextAnalyzer`
- `VALIDATE_ID_NUMBER_API` — Dominican national ID validation API endpoint
- `DATAS` — data source selection
- `PACKAGE_TOKEN` — GitHub Container Registry token (CI/CD only)
- `DOKPLOY_{SERVICE}_WEBHOOK` — Dokploy deployment webhook per service (e.g., `DOKPLOY_DOWNLOAD_LINKS_WEBHOOK`)

Each service has its own `.env` file loaded via `dotenv`.

## Key Patterns

- **ES Modules**: All JS services use `"type": "module"` and `.js` extensions in imports.
- **Retry logic**: EventBus auto-retries up to 3 times via dead-letter exchanges (`{queue}_try`).
- **Prefetch/concurrency**: `EventBus.init(exchange, handler, prefetch?)` defaults to `prefetch=4`. High-throughput services (e.g., `insertData`) override with `eventBus.prefetch(100)`.
- **Test mode**: `eventBus.testMode = true` disables logging for unit tests.
- **Mixed language**: JS services for business logic/API, Python services for OCR (`extractedText`) and PDF processing (`postDownloadPy`, `pII`).
- **Monorepo workspaces**: Root `package.json` uses npm workspaces (`"workspaces": ["projects/*"]`).
- **CI/CD**: `build-changed-services.sh` diffs `HEAD~1..HEAD`, builds only changed service Docker images, pushes to `ghcr.io/gabrieltrinidad0101/informacion-dominicana-{service}:latest`, and triggers Dokploy webhooks.
