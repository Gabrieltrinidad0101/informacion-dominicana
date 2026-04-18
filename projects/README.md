# Projects

Pipeline: `download → aiProcess → insertData`

Institution keys: `ayuntamientoJarabacoa`, `ayuntamientoMoca`, `intrant`

---

## download

Downloads PDFs/Excel from an institution's website into MinIO.

```bash
# Download all files from an institution
node projects/download/main.js ayuntamientoJarabacoa

# Retry previously failed downloads
node projects/download/main.js ayuntamientoMoca --retry

node projects/download/main.js intrant --retry
```

---

## aiProcess

Reads files from MinIO `download/`, runs AI extraction, writes JSON to `aiProcess/`.

```bash
# Process all files for an institution
node projects/aiProcess/main.js ayuntamientoJarabacoa

# Process a specific file
node projects/aiProcess/main.js ayuntamientoMoca --file nomina_enero_2025.pdf

# Process a specific page of a PDF
node projects/aiProcess/main.js intrant --file nomina_enero_2025.pdf --page 2

# Filter by year and month
node projects/aiProcess/main.js ayuntamientoJarabacoa --year 2025 --month enero

# Force re-process already processed files
node projects/aiProcess/main.js ayuntamientoJarabacoa --force

# Combine flags
node projects/aiProcess/main.js intrant --year 2025 --month marzo --force
```

---

## insertData

Reads JSON from MinIO `aiProcess/` and upserts records into PostgreSQL.

```bash
# Insert all institutions
node projects/insertData/main.js

# Insert a specific institution
node projects/insertData/main.js ayuntamientoJarabacoa

node projects/insertData/main.js intrant
```

---

## Other services

```bash
npm run filesManager   # MinIO HTTP proxy on port 4000
npm run exportToJson   # Export aggregated stats to MinIO
npm run worldBank      # World Bank data pipeline
npm run frontend       # Docusaurus site
```
