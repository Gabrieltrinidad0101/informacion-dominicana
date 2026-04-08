import 'dotenv/config'
import axios from 'axios'
import Anthropic from '@anthropic-ai/sdk'
import { read as xlsxRead, utils as xlsxUtils } from 'xlsx'
import { PDFDocument } from 'pdf-lib'
import { institutions } from '../shared/institutions.js'
import { FileManagerClient } from '../shared/fileManagerClient.js'
import { prompt } from './prompt.js'

const fileManagerClient = new FileManagerClient()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── helpers ──────────────────────────────────────────────────────────────────

const parseLines = (text) =>
    text.trim().split('\n')
        .filter(l => l.includes('|'))
        .map(line => {
            const [name, document, position, income, sex, accountBack, phoneNumber] = line.split('|')
            return { name, document, position, income, sex, accountBack, phoneNumber }
        })

// ── DeepSeek (Excel) ─────────────────────────────────────────────────────────

const processWithDeepSeek = async (content) => {
    const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: `${prompt}\n\nDATA:\n${content}` }],
            temperature: 0.1
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.API_AI_KEY}`,
                'Content-Type': 'application/json'
            }
        }
    )
    return response.data?.choices?.[0]?.message?.content ?? ''
}

const processExcel = async (buffer) => {
    const workbook = xlsxRead(buffer)
    const allLines = []
    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName]
        const csv = xlsxUtils.sheet_to_csv(sheet)
        const raw = await processWithDeepSeek(csv)
        allLines.push(...parseLines(raw))
    }
    return allLines
}

// ── Claude API (PDF) ─────────────────────────────────────────────────────────

const processPdfPage = async (pdfDoc, pageIndex) => {
    const singlePage = await PDFDocument.create()
    const [copied] = await singlePage.copyPages(pdfDoc, [pageIndex])
    singlePage.addPage(copied)
    const pageBytes = await singlePage.save()
    const base64 = Buffer.from(pageBytes).toString('base64')

    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 8192,
        messages: [{
            role: 'user',
            content: [
                {
                    type: 'document',
                    source: { type: 'base64', media_type: 'application/pdf', data: base64 }
                },
                { type: 'text', text: prompt }
            ]
        }]
    })
    return parseLines(message.content[0].text)
}

// ── args ─────────────────────────────────────────────────────────────────────

const parseArgs = (argv) => {
    const args = { institutionKey: null, file: null, page: null, year: null, force: false }
    for (let i = 2; i < argv.length; i++) {
        if (argv[i] === '--file') { args.file = argv[++i]; continue }
        if (argv[i] === '--page') { args.page = parseInt(argv[++i], 10); continue }
        if (argv[i] === '--year') { args.year = argv[++i]; continue }
        if (argv[i] === '--force') { args.force = true; continue }
        if (!args.institutionKey) args.institutionKey = argv[i]
    }
    return args
}

const args = parseArgs(process.argv)
const force = args.force

if (force) console.log('Force mode: existing AI results will be overwritten')

if (args.year) console.log(`Filtering by year: ${args.year}`)

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

        const buffer = await fileManagerClient.getFile(downloadKey)

        if (ext === 'xlsx' || ext === 'xls') {
            if (!force && await fileManagerClient.fileExists(aiKey)) {
                console.log(`  Skipping (already exists): ${aiKey}`)
                continue
            }
            const lines = await processExcel(buffer)
            await fileManagerClient.createTextFile(aiKey, JSON.stringify({ lines }))
            console.log(`  Saved (Excel->DeepSeek): ${aiKey} — ${lines.length} record(s)`)

        } else if (ext === 'pdf') {
            const pdfDoc = await PDFDocument.load(buffer)
            const pageCount = pdfDoc.getPageCount()

            // Determine which pages to process
            const pagesToProcess = args.page !== null
                ? [args.page]
                : Array.from({ length: pageCount }, (_, i) => i)

            for (const pageIndex of pagesToProcess) {
                if (pageIndex < 0 || pageIndex >= pageCount) {
                    console.error(`  Page ${pageIndex} out of range (0–${pageCount - 1}), skipping`)
                    continue
                }
                const pageKey = aiKey.replace('.json', `_page${pageIndex}.json`)
                if (!force && await fileManagerClient.fileExists(pageKey)) {
                    console.log(`  Skipping (already exists): ${pageKey}`)
                    continue
                }
                console.log(`  Processing page ${pageIndex + 1}/${pageCount}`)
                const lines = await processPdfPage(pdfDoc, pageIndex)
                await fileManagerClient.createTextFile(pageKey, JSON.stringify({ lines }))
                console.log(`  Saved (PDF->Claude p${pageIndex}): ${pageKey} — ${lines.length} record(s)`)
            }

        } else {
            console.log(`  Unsupported file type: ${ext}, skipping`)
        }
    }
}

console.log('\nAI process complete.')
