import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

// Single source of truth for the institution registry lives in institutions.json
// (so the Python PII service and the React frontend can consume the same data).
// Read via fs to avoid relying on JSON import attributes across Node versions.
const __dirname = dirname(fileURLToPath(import.meta.url))

export const institutions = JSON.parse(
    readFileSync(join(__dirname, 'institutions.json'), 'utf-8')
)
