import { execFile } from 'child_process'
import { promisify } from 'util'
import { mkdtemp, writeFile, readFile, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { PDFDocument, degrees } from 'pdf-lib'
import { askJson, buildParams, UsageLimitReached } from './llm.js'
import { pdfPageSystem, pdfLayoutSystem } from './prompt.js'
import { parseAmount, isHonorific, norm } from './excel.js'

// PDF pages are rendered with poppler (pdftoppm / pdftotext) and read by
// Claude. The model copies values as printed; amounts are parsed here.

const run = promisify(execFile)

// Opus 5 reads images up to 2576px on the long edge without downscaling.
const RENDER_LONG_EDGE = 2576
// Pages with fewer text-layer characters than this are treated as scanned.
const MIN_TEXT_LAYER_CHARS = 200

const nullableString = { anyOf: [{ type: 'string' }, { type: 'null' }] }
const FIELDS = ['name', 'document', 'position', 'income', 'sex', 'accountBack', 'phoneNumber']

const LABEL_FIELDS = {
    anyOf: [
        { type: 'null' },
        {
            type: 'object',
            additionalProperties: false,
            required: ['document', 'position', 'accountBack', 'phoneNumber'],
            properties: {
                document: nullableString,
                position: nullableString,
                accountBack: nullableString,
                phoneNumber: nullableString,
            },
        },
    ],
}

const PAGE_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: ['rotation', 'columns', 'leadingFields', 'trailingFields', 'rows', 'notes'],
    properties: {
        rotation: { type: 'integer', enum: [0, 90, 180, 270] },
        columns: { type: 'array', items: { type: 'string' } },
        leadingFields: LABEL_FIELDS,
        trailingFields: LABEL_FIELDS,
        rows: { type: 'array', items: { type: 'array', items: { type: 'string' } } },
        notes: { type: 'string' },
    },
}

// ── poppler helpers ──────────────────────────────────────────────────────────

// Opens a PDF already on disk; renders go to a temporary directory.
export const openPdfFile = async (file) => {
    const dir = await mkdtemp(join(tmpdir(), 'aiprocess-'))
    try {
        const { stdout } = await run('pdfinfo', [file])
        const pageCount = Number(/^Pages:\s+(\d+)/m.exec(stdout)?.[1])
        if (!pageCount) throw new Error('pdfinfo could not read the page count')
        return { dir, file, pageCount, close: () => rm(dir, { recursive: true, force: true }) }
    } catch (err) {
        await rm(dir, { recursive: true, force: true })
        throw err
    }
}

export const openPdf = async (buffer) => {
    const dir = await mkdtemp(join(tmpdir(), 'aiprocess-src-'))
    const file = join(dir, 'source.pdf')
    await writeFile(file, buffer)
    try {
        const pdf = await openPdfFile(file)
        return { ...pdf, close: async () => { await pdf.close(); await rm(dir, { recursive: true, force: true }) } }
    } catch (err) {
        await rm(dir, { recursive: true, force: true })
        throw err
    }
}

export const textLayer = async (file, pageNumber) => {
    try {
        const { stdout } = await run('pdftotext', ['-layout', '-f', `${pageNumber}`, '-l', `${pageNumber}`, file, '-'], { maxBuffer: 20 * 1024 * 1024 })
        return stdout.replace(/\f/g, '').trimEnd()
    } catch {
        return ''
    }
}

export const renderJpeg = async (file, pageNumber, outBase, longEdge = RENDER_LONG_EDGE) => {
    await run('pdftoppm', [
        '-f', `${pageNumber}`, '-l', `${pageNumber}`, '-singlefile',
        '-scale-to', `${longEdge}`,
        '-jpeg', '-jpegopt', 'quality=90',
        file, outBase,
    ])
    return readFile(`${outBase}.jpg`)
}

// Copies one page into its own PDF with extra clockwise rotation.
const rotatedPageFile = async (pdf, pageIndex, extraRotation) => {
    const source = await PDFDocument.load(await readFile(pdf.file), { ignoreEncryption: true })
    const single = await PDFDocument.create()
    const [page] = await single.copyPages(source, [pageIndex])
    page.setRotation(degrees((page.getRotation().angle + extraRotation) % 360))
    single.addPage(page)
    const out = join(pdf.dir, `page${pageIndex}-rot${extraRotation}.pdf`)
    await writeFile(out, await single.save())
    return out
}

// ── verification against the text layer ─────────────────────────────────────

const words = (text) => new Set(norm(text).split(/[^a-z0-9ñ.,-]+/).filter(Boolean))
const digitTokens = (text) => new Set(text.split(/\s+/).map(t => t.replace(/\D/g, '')).filter(Boolean))

// Digital pages only: every name word and the income digits must appear in the
// page's text layer. Scanned pages return null (nothing to compare against).
const verifyWithTextLayer = (line, text) => {
    if (!text) return null
    const pageWords = words(text)
    const pageDigits = digitTokens(text)
    const nameOk = norm(line.name).split(/\s+/).every(w => pageWords.has(w) || [...pageWords].some(p => p.includes(w)))
    let incomeOk = true
    if (line.incomeRaw && !isHonorific(line.incomeRaw)) {
        incomeOk = pageDigits.has(line.incomeRaw.replace(/\D/g, ''))
    }
    return nameOk && incomeOk
}

// ── row parsing ──────────────────────────────────────────────────────────────

const ROW_FIELDS = ['name', 'document', 'position', 'income', 'sex', 'sexGuess', 'accountBack', 'phoneNumber', 'uncertain']

// One array of 9 strings per person. A row with another length is kept as
// { malformed } instead of being guessed, so fields never shift.
export const parseRows = (rows) => rows
    .filter(row => row.some(v => v.trim()))
    .map(row => {
        const parts = row.map(v => v.trim())
        if (parts.length !== ROW_FIELDS.length || !parts[0]) return { malformed: JSON.stringify(row) }
        const person = Object.fromEntries(ROW_FIELDS.map((f, i) => [f, parts[i] || null]))
        person.uncertain = (person.uncertain ?? '').split(',').map(u => u.trim()).filter(u => FIELDS.includes(u))
        return person
    })

// ── page extraction ──────────────────────────────────────────────────────────

const LAYOUT_TEXT = {
    one_row: 'Each person\'s data is on one row.',
    label_line_above_name: 'Each person\'s label line ("Cargo:", "Departamento:" ...) is printed ABOVE that person\'s name line. So a label line at the bottom of this page belongs to the first person of the next page (return it in trailingFields), and the first person on this page may have their labels at the bottom of the previous page (then leave those fields null).',
    label_line_below_name: 'Each person\'s label line ("Cargo:", "Departamento:" ...) is printed BELOW that person\'s name line. So a label line at the top of this page, before the first name line, belongs to the last person of the previous page (return it in leadingFields), and the last person on this page may have their labels on the next page (then leave those fields null).',
}

const describeContext = (context) => {
    if (!context) return ''
    const parts = []
    if (context.layout) {
        const layoutText = LAYOUT_TEXT[context.layout.recordLayout] ?? `Record layout: ${context.layout.evidence}`
        parts.push(`Record layout in this document: ${layoutText}`)
    }
    if (context.columns?.length) parts.push(`Column headers on the previous page: ${context.columns.join(' | ')}`)
    if (context.lastName) parts.push(`Last person on the previous page: ${context.lastName}`)
    return parts.join('\n')
}

const jpegBlock = (image) => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image.toString('base64') } })

// ── layout (once per document) ───────────────────────────────────────────────

const LAYOUT_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: ['recordLayout', 'evidence'],
    properties: {
        recordLayout: { type: 'string', enum: ['one_row', 'label_line_above_name', 'label_line_below_name', 'other'] },
        evidence: { type: 'string' },
    },
}

const LAYOUT_LONG_EDGE = 1600

export const FAILED_LAYOUT = { recordLayout: 'other', evidence: 'layout detection failed' }

// The first, a middle, and the last page: the end of a report is unambiguous.
export const layoutRequest = async (pdf) => {
    const indexes = [...new Set([0, Math.floor((pdf.pageCount - 1) / 2), pdf.pageCount - 1])]
    const content = []
    for (const pageIndex of indexes) {
        const image = await renderJpeg(pdf.file, pageIndex + 1, join(pdf.dir, `layout${pageIndex}`), LAYOUT_LONG_EDGE)
        content.push({ type: 'text', text: `Page ${pageIndex + 1} of ${pdf.pageCount}:` })
        content.push(jpegBlock(image))
    }
    content.push({ type: 'text', text: 'How is each person\'s record laid out in this document?' })
    return { system: pdfLayoutSystem, content, schema: LAYOUT_SCHEMA, effort: 'high' }
}

export const detectLayout = async (pdf) => {
    const usage = []
    const layout = await askJson({ ...(await layoutRequest(pdf)), onUsage: (u) => usage.push(u) })
    return { ...layout, usage }
}

// ── one page ─────────────────────────────────────────────────────────────────

// Image (optionally straightened by `rotation` clockwise degrees) and the
// text layer of one page. Rotation needs pdf-lib and can fail on odd PDFs.
// The page's text layer, or '' for scanned pages.
export const pageText = async (pdf, pageIndex) => {
    const rawText = await textLayer(pdf.file, pageIndex + 1)
    return rawText.replace(/\s/g, '').length >= MIN_TEXT_LAYER_CHARS ? rawText : ''
}

export const pageInputs = async (pdf, pageIndex, rotation = 0) => {
    const text = await pageText(pdf, pageIndex)
    const image = rotation
        ? await renderJpeg(await rotatedPageFile(pdf, pageIndex, rotation), 1, join(pdf.dir, `page${pageIndex}-rot${rotation}`))
        : await renderJpeg(pdf.file, pageIndex + 1, join(pdf.dir, `page${pageIndex}`))
    return { image, text }
}

export const pageRequest = ({ image, text, context }) => {
    const content = [jpegBlock(image)]
    if (text) content.push({ type: 'text', text: `Text layer of this page:\n<text_layer>\n${text}\n</text_layer>` })
    const contextText = describeContext(context)
    if (contextText) content.push({ type: 'text', text: contextText })
    content.push({ type: 'text', text: 'Transcribe the payroll rows on this page.' })
    return { system: pdfPageSystem, content, schema: PAGE_SCHEMA, effort: 'high', maxTokens: 64000 }
}

export const pageParams = (inputs) => buildParams(pageRequest(inputs))
export const layoutParams = async (pdf) => buildParams(await layoutRequest(pdf))

export const countMalformed = (answer) => parseRows(answer.rows).filter(p => p.malformed).length

const sexOf = (value) => /^m/i.test(value ?? '') ? 'M' : /^f/i.test(value ?? '') ? 'F' : ''

const toLine = (person, text) => {
    const honorific = isHonorific(person.income)
    const amount = honorific ? null : parseAmount(person.income)
    const uncertain = [...person.uncertain]
    if (!honorific && amount === null && !uncertain.includes('income')) uncertain.push('income')
    const line = {
        // Stray trailing dots are print artifacts ("JUAN PEREZ .").
        name: person.name.replace(/\s+/g, ' ').trim().replace(/\s+\.$/, ''),
        document: person.document ?? '',
        position: person.position ?? '',
        income: honorific ? 'Honorífico' : (amount === null ? '' : String(amount)),
        sex: sexOf(person.sex),
        // An account printed as "0" is a placeholder, not an account.
        accountBack: (person.accountBack ?? '').replace(/\D/g, '').replace(/^0+$/, ''),
        phoneNumber: (person.phoneNumber ?? '').replace(/\D/g, ''),
        incomeRaw: person.income ?? '',
    }
    // Printed sex wins; otherwise the model's guess from names/position.
    if (!line.sex && sexOf(person.sexGuess)) {
        line.sex = sexOf(person.sexGuess)
        line.sexInferred = true
    }
    line.verifiedByTextLayer = verifyWithTextLayer(line, text)
    line.uncertain = uncertain
    line.needsReview = uncertain.length > 0 || line.verifiedByTextLayer === false
    return line
}

// Turns the final answer for a page into the stored result.
export const pageResult = (answer, { pageIndex, text, layout, rotation, usage, extraNotes = [] }) => {
    const lines = parseRows(answer.rows).map(p => p.malformed
        ? { name: '', malformedRow: p.malformed, needsReview: true, uncertain: [] }
        : toLine(p, text))
    return {
        lines,
        page: {
            pageIndex,
            source: text ? 'digital' : 'scanned',
            rotation,
            columns: answer.columns,
            layout: layout?.recordLayout ?? null,
            layoutEvidence: layout?.evidence ?? null,
            leadingFields: answer.leadingFields,
            trailingFields: answer.trailingFields,
            notes: [answer.notes, ...extraNotes].filter(Boolean).join(' | '),
            needsReview: lines.filter(l => l.needsReview).length,
            malformedRows: lines.filter(l => l.malformedRow).length,
            usage,
        },
    }
}

// Synchronous extraction of one page (0-based index); throws on API errors.
// Rotated pages are straightened and read again; pages with malformed rows
// are read once more and the better answer is kept.
export const extractPage = async (pdf, pageIndex, context) => {
    const usage = []
    const ask = (inputs) => askJson({ ...pageRequest({ ...inputs, context }), onUsage: (u) => usage.push(u) })
    const extraNotes = []

    let inputs = await pageInputs(pdf, pageIndex)
    let answer = await ask(inputs)
    let rotation = 0

    if (answer.rotation !== 0) {
        try {
            const rotated = await pageInputs(pdf, pageIndex, answer.rotation)
            rotation = answer.rotation
            inputs = rotated
            answer = await ask(inputs)
            extraNotes.push(`page rotated ${rotation}° before reading`)
            if (answer.rotation !== 0) extraNotes.push(`still reported rotation ${answer.rotation}`)
        } catch (err) {
            if (err instanceof UsageLimitReached) throw err
            extraNotes.push(`could not rotate page (${err.message}); read as is`)
        }
    }

    if (countMalformed(answer) > 0) {
        const retry = await ask(inputs)
        if (countMalformed(retry) < countMalformed(answer)) {
            answer = retry
            extraNotes.push('re-read after malformed rows')
        }
    }

    return pageResult(answer, { pageIndex, text: inputs.text, layout: context?.layout, rotation, usage, extraNotes })
}

// ── labels printed on a neighbouring page ────────────────────────────────────

const fillEmpty = (line, fields, marker) => {
    if (!line || !fields) return false
    let changed = false
    for (const [field, value] of Object.entries(fields)) {
        if (!value || line[field]) continue
        line[field] = field === 'accountBack' || field === 'phoneNumber' ? value.replace(/\D/g, '') : value
        line[marker] = [...(line[marker] ?? []), field]
        changed = true
    }
    return changed
}

// Moves label fields that were printed on a neighbouring page to their person:
// - labels above the name: the previous page's trailing labels belong to this
//   page's first person;
// - labels below the name: this page's leading labels belong to the previous
//   page's last person.
// Only empty fields are filled. Returns whether the previous page changed.
export const linkAcrossPages = (previous, current) => {
    if (!previous) return false
    const layout = current.page.layout
    if (layout === 'label_line_above_name') {
        fillEmpty(current.lines[0], previous.page.trailingFields, 'fromPreviousPage')
        return false
    }
    if (layout === 'label_line_below_name') {
        return fillEmpty(previous.lines.at(-1), current.page.leadingFields, 'fromNextPage')
    }
    return false
}
