import 'dotenv/config'
import { SPREADSHEET_EXTENSIONS } from './excel.js'
import { processSpreadsheet } from './spreadsheet.js'
import { openPdf, extractPage, detectLayout, linkAcrossPages, FAILED_LAYOUT } from './pdf.js'
import { runPdfBatch } from './batch.js'
import { usageCost, UsageLimitReached } from './llm.js'
import { institutions } from '../shared/institutions.js'
import { FileManagerClient } from '../shared/fileManagerClient.js'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const errorsDir = join(__dirname, 'errors')

const fileManagerClient = new FileManagerClient()

// ── error logging ─────────────────────────────────────────────────────────────

const saveError = async (data, error) => {
    await mkdir(errorsDir, { recursive: true })
    const date = new Date().toISOString().split('T')[0]
    const filePath = join(errorsDir, `${date}.json`)
    let entries = []
    try {
        entries = JSON.parse(await readFile(filePath, 'utf-8'))
    } catch { /* file doesn't exist yet */ }
    entries.push({
        timestamp: new Date().toISOString(),
        data,
        error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error)
    })
    await writeFile(filePath, JSON.stringify(entries, null, 2))
}

// ── Spreadsheets (xlsx/xls/csv/...) ─────────────────────────────────────────

const processSpreadsheetFile = async (buffer, downloadKey) => {
    let result
    try {
        result = await processSpreadsheet(buffer)
    } catch (err) {
        if (err instanceof UsageLimitReached) throw err
        await saveError({ source: 'spreadsheet', downloadKey }, err)
        return null
    }
    for (const sheet of result.sheets) {
        const detail = sheet.payroll
            ? `${sheet.extracted} row(s), ${sheet.skipped} skipped, mapping: ${sheet.mappingSource}` +
              (sheet.droppedColumns?.length ? `, dropped: ${sheet.droppedColumns.join(', ')}` : '')
            : `ignored (${sheet.reason})`
        console.log(`  Sheet "${sheet.sheet}": ${detail}`)
    }
    if (result.errors.length) {
        await saveError({ source: 'spreadsheet', downloadKey, errors: result.errors }, 'partial errors')
    }
    // Nothing usable: don't write a result, so the file is retried once fixed.
    if (result.lines.length === 0) {
        await saveError({ source: 'spreadsheet', downloadKey, sheets: result.sheets }, 'no payroll rows extracted')
        return null
    }
    return result
}

// ── PDF ──────────────────────────────────────────────────────────────────────

const totals = { input: 0, output: 0, cost: 0, pages: 0 }

const addUsage = (usage, countPage = true) => {
    let input = 0, output = 0
    for (const u of usage) {
        const c = usageCost(u)
        input += c.input
        output += c.output
        totals.cost += c.cost
    }
    totals.input += input
    totals.output += output
    if (countPage) totals.pages++
    return { input, output }
}

const pageKeyOf = (downloadKey, pageIndex) =>
    fileManagerClient.toAiPath(downloadKey).replace('.json', `_page${pageIndex}.json`)

const loadPageResult = async (key) => {
    try {
        return JSON.parse((await fileManagerClient.getFile(key)).toString('utf-8'))
    } catch {
        return null
    }
}

const processPdfFile = async (buffer, downloadKey) => {
    let pdf
    try {
        pdf = await openPdf(buffer)
    } catch (err) {
        console.log(`  Skipping (cannot open PDF: ${err.message})`)
        await saveError({ source: 'pdf', downloadKey }, err)
        return
    }
    const keyOf = (pageIndex) => pageKeyOf(downloadKey, pageIndex)
    try {
        const pagesToProcess = args.page !== null
            ? [args.page]
            : Array.from({ length: pdf.pageCount }, (_, i) => i)

        // Result of the page just before the current one, for context and for
        // fields printed on a neighbouring page. Only new-format results (with
        // `page` metadata) are ever rewritten.
        let previous = null
        // How records are laid out in this document; detected once, lazily.
        let layout = null

        for (const pageIndex of pagesToProcess) {
            if (pageIndex < 0 || pageIndex >= pdf.pageCount) {
                console.error(`  Page ${pageIndex} out of range (0–${pdf.pageCount - 1}), skipping`)
                continue
            }
            const pageKey = keyOf(pageIndex)
            if (!force && await fileManagerClient.fileExists(pageKey)) {
                console.log(`  Skipping (already exists): ${pageKey}`)
                previous = null
                continue
            }
            if (previous?.pageIndex !== pageIndex - 1) {
                const data = pageIndex > 0 ? await loadPageResult(keyOf(pageIndex - 1)) : null
                previous = data?.page ? { pageIndex: pageIndex - 1, key: keyOf(pageIndex - 1), data } : null
            }
            if (!layout && previous?.data.page.layout) {
                layout = { recordLayout: previous.data.page.layout, evidence: previous.data.page.layoutEvidence ?? '' }
            }
            if (!layout) {
                try {
                    const detected = await detectLayout(pdf)
                    addUsage(detected.usage, false)
                    layout = detected
                    console.log(`  Record layout: ${layout.recordLayout} — ${layout.evidence}`)
                } catch (err) {
                    if (err instanceof UsageLimitReached) throw err
                    console.error(`  Layout detection failed: ${err.message}`)
                    await saveError({ source: 'pdf', downloadKey, step: 'detectLayout' }, err)
                    layout = FAILED_LAYOUT
                }
            }
            const context = {
                layout,
                columns: previous?.data.page.columns,
                lastName: previous?.data.lines.at(-1)?.name,
            }

            console.log(`  Processing page ${pageIndex + 1}/${pdf.pageCount}`)
            let result
            try {
                result = await extractPage(pdf, pageIndex, context)
            } catch (err) {
                if (err instanceof UsageLimitReached) throw err
                console.error(`  Page ${pageIndex} failed: ${err.message}`)
                await saveError({ source: 'pdf', downloadKey, pageIndex }, err)
                previous = null
                continue
            }

            if (linkAcrossPages(previous?.data, result)) {
                await fileManagerClient.createTextFile(previous.key, JSON.stringify(previous.data))
                console.log(`  Updated previous page with labels printed on this page: ${previous.key}`)
            }

            const data = { lines: result.lines, page: result.page }
            await fileManagerClient.createTextFile(pageKey, JSON.stringify(data))
            const tokens = addUsage(result.page.usage)
            console.log(`  Saved (${result.page.source}${result.page.rotation ? `, rotated ${result.page.rotation}°` : ''}): ${pageKey} — ` +
                `${result.lines.length} record(s), ${result.page.needsReview} to review, ${tokens.input}/${tokens.output} tokens in/out`)
            previous = { pageIndex, key: pageKey, data }
        }
    } finally {
        await pdf.close()
    }
}

// ── args ─────────────────────────────────────────────────────────────────────

const parseArgs = (argv) => {
    const args = { institutionKey: null, file: null, page: null, year: null, month: null, force: false, batch: false }
    for (let i = 2; i < argv.length; i++) {
        if (argv[i] === '--file') { args.file = argv[++i]; continue }
        if (argv[i] === '--page') { args.page = parseInt(argv[++i], 10); continue }
        if (argv[i] === '--year') { args.year = argv[++i]; continue }
        if (argv[i] === '--month') { args.month = argv[++i]; continue }
        if (argv[i] === '--force') { args.force = true; continue }
        if (argv[i] === '--batch') { args.batch = true; continue }
        if (!args.institutionKey) args.institutionKey = argv[i]
    }
    return args
}

const args = parseArgs(process.argv)
const force = args.force

if (force) console.log('Force mode: existing AI results will be overwritten')

if (args.year) console.log(`Filtering by year: ${args.year}`)
if (args.batch) console.log('Batch mode: PDFs go through the Message Batches API (half price, results within 24 h)')

// PDFs collected for batch mode
const batchPdfKeys = []

// ── main ─────────────────────────────────────────────────────────────────────

const targetInstitutions = args.institutionKey
    ? [institutions[args.institutionKey]].filter(Boolean)
    : Object.values(institutions)

if (args.institutionKey && targetInstitutions.length === 0) {
    console.error(`Unknown institution: "${args.institutionKey}"`)
    process.exit(1)
}

for (const institution of targetInstitutions) {
    const prefix = `${institution.institutionName}/${institution.typeOfData}/download/`
    console.log(`\nScanning MinIO: ${prefix}`)

    let downloadKeys = await fileManagerClient.listFiles(prefix)

    if (args.year) {
        downloadKeys = downloadKeys.filter(k => k.split('/')[3] === args.year)
    }
    if (args.month) {
        downloadKeys = downloadKeys.filter(k => k.split('/')[4] === args.month)
    }

    // Filter by --file if provided (matches full key or just the filename)
    if (args.file) {
        downloadKeys = downloadKeys.filter(k =>
            k === args.file || k.endsWith(`/${args.file}`)
        )
        if (downloadKeys.length === 0) {
            console.error(`  No file matching "${args.file}" found under ${prefix}`)
            continue
        }
    }

    console.log(`Found ${downloadKeys.length} file(s) to process`)
    for (const downloadKey of downloadKeys) {
        const aiKey = fileManagerClient.toAiPath(downloadKey)

        const ext = downloadKey.split('.').pop().toLowerCase()
        console.log(`Processing [${ext}]: ${downloadKey}`)

        if (ext === 'pdf' && args.batch) {
            batchPdfKeys.push(downloadKey)
            continue
        }

        const buffer = await fileManagerClient.getFile(downloadKey)

        if (SPREADSHEET_EXTENSIONS.includes(ext)) {
            if (!force && await fileManagerClient.fileExists(aiKey)) {
                console.log(`  Skipping (already exists): ${aiKey}`)
                continue
            }
            const result = await processSpreadsheetFile(buffer, downloadKey)
            if (result === null) {
                console.log(`  Skipping (see errors log): ${downloadKey}`)
                continue
            }
            await fileManagerClient.createTextFile(aiKey, JSON.stringify({ lines: result.lines, sheets: result.sheets }))
            console.log(`  Saved (spreadsheet): ${aiKey} — ${result.lines.length} record(s)`)

        } else if (ext === 'pdf') {
            await processPdfFile(buffer, downloadKey)

        } else {
            console.log(`  Unsupported file type: ${ext}, skipping`)
        }
    }
}

if (args.batch) {
    await runPdfBatch({
        downloadKeys: batchPdfKeys,
        fm: fileManagerClient,
        force,
        page: args.page,
        pageKeyOf,
        saveError,
    })
}

if (totals.pages) {
    console.log(`\nPDF pages: ${totals.pages}, tokens in/out: ${totals.input}/${totals.output}, estimated cost: $${totals.cost.toFixed(2)}`)
}
console.log('\nAI process complete.')
