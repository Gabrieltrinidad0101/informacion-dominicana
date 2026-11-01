import { readFile, writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import {
    readWorkbook, sheetRows, previewRows, layoutSignature,
    validateMapping, detectHeader, extractRows, norm,
} from './excel.js'
import { askJson, UsageLimitReached } from './llm.js'

// Spreadsheet pipeline: a model maps the columns of each sheet layout (cached
// by layout), the code reads the values, and a model infers sex from first
// names only when the sheet has no sex column.

const cacheDir = join(dirname(fileURLToPath(import.meta.url)), 'cache')
const mappingsFile = join(cacheDir, 'columnMappings.json')
const sexFile = join(cacheDir, 'firstNameSex.json')

const loadJson = async (file) => {
    try { return JSON.parse(await readFile(file, 'utf-8')) } catch { return {} }
}
const saveJson = async (file, data) => {
    await mkdir(cacheDir, { recursive: true })
    await writeFile(file, JSON.stringify(data, null, 2))
}

// ── column mapping ───────────────────────────────────────────────────────────

const nullableIndex = { anyOf: [{ type: 'integer' }, { type: 'null' }] }

const MAPPING_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: ['isPayroll', 'headerRow', 'name', 'income', 'document', 'position', 'sex', 'accountBack', 'phoneNumber', 'notes'],
    properties: {
        isPayroll: { type: 'boolean' },
        headerRow: nullableIndex,
        name: { type: 'array', items: { type: 'integer' } },
        income: nullableIndex,
        document: nullableIndex,
        position: nullableIndex,
        sex: nullableIndex,
        accountBack: nullableIndex,
        phoneNumber: nullableIndex,
        notes: { type: 'string' },
    },
}

const MAPPING_SYSTEM = `You map the columns of payroll spreadsheets published by Dominican Republic government institutions. The sheet is shown as rows "rN:" with cells "[cM] value" (N = row index, M = column index, both 0-based; empty cells are omitted).

Headers are unreliable: labels may be misspelled (Nembre, Nambre), abbreviated, split across several rows, shifted a column away from their data, or swapped (a column labelled "Apellidos" holding first names). Decide each column from the data rows, using the labels only as hints.

Fields:
- isPayroll: true only if the sheet lists individual people with their pay. Summaries, totals, tax/TSS reports without per-person pay, and scratch sheets are false.
- headerRow: index of the last header row; data starts after it. null if there is no header.
- name: column indexes that together hold the person's full name, in the order that reads "first names then last names". Usually a single column.
- income: the person's gross monthly pay (bruto / sueldo / salario / monto). Not net pay, not deductions, not "otros ingresos".
- document: the cédula (000-0000000-0 or 11 digits). Not employee, card (tarjeta), or record numbers.
- position: job title (cargo / puesto / función / rango). Not the department.
- sex, accountBack (bank account number), phoneNumber.
Use null (or [] for name) for anything the sheet does not have. Put anything unusual in notes.`

const askMapping = async (preview, sheetName) => {
    const answer = await askJson({
        system: MAPPING_SYSTEM,
        prompt: `Sheet "${sheetName}":\n\n${preview}`,
        schema: MAPPING_SCHEMA,
    })
    const columns = { name: answer.name }
    for (const field of ['income', 'document', 'position', 'sex', 'accountBack', 'phoneNumber']) {
        if (Number.isInteger(answer[field])) columns[field] = answer[field]
    }
    return { isPayroll: answer.isPayroll, headerRow: answer.headerRow, columns, notes: answer.notes }
}

// ── sex from first names ─────────────────────────────────────────────────────

const SEX_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: ['results'],
    properties: {
        results: {
            type: 'array',
            items: {
                type: 'object',
                additionalProperties: false,
                required: ['name', 'sex'],
                properties: {
                    name: { type: 'string' },
                    sex: { type: 'string', enum: ['M', 'F', ''] },
                },
            },
        },
    },
}

const SEX_SYSTEM = `Each line is the start of a Dominican person's name: one or two words, normally given names, though the second word may be a surname. Return the sex these names are usually given to: M, F, or "" when it is genuinely ambiguous or the words are not given names. When two words are given, use both (e.g. "cruz maria" is F, "odalis antonio" is M). Echo each line exactly in "name".`

const TITLES = /^(lic|licda|licdo|dr|dra|ing|arq|prof|sr|sra|srta|agrim|coronel|cabo|sargento|capitan|teniente|raso)\.?$/

const PARTICLES = /^(de|del|la|las|los|y)$/

// "PEREZ DIAZ, JUAN CARLOS" → ["juan", "carlos"]; "LENNY DEL CARMEN BUENO" → ["lenny", "carmen"]
export const givenNamesOf = (fullName) => {
    const afterComma = fullName.includes(',') ? fullName.split(',').slice(1).join(' ') : fullName
    return norm(afterComma).split(' ')
        .filter(t => /^[a-z]{2,}$/.test(t) && !TITLES.test(t) && !PARTICLES.test(t))
        .slice(0, 2)
}

const SEX_BATCH = 300
const SEX_CONCURRENCY = 4

const classifyNames = async (names, cache, errors) => {
    const batches = []
    for (let i = 0; i < names.length; i += SEX_BATCH) batches.push(names.slice(i, i + SEX_BATCH))
    const run = async (batch) => {
        try {
            const { results } = await askJson({
                system: SEX_SYSTEM,
                prompt: batch.join('\n'),
                schema: SEX_SCHEMA,
                effort: 'low',
            })
            const bySex = new Map(results.map(r => [norm(r.name), r.sex]))
            for (const name of batch) if (bySex.has(name)) cache[name] = bySex.get(name)
        } catch (err) {
            if (err instanceof UsageLimitReached) throw err
            errors.push({ step: 'inferSex', error: err.message })
        }
    }
    for (let i = 0; i < batches.length; i += SEX_CONCURRENCY) {
        await Promise.all(batches.slice(i, i + SEX_CONCURRENCY).map(run))
    }
}

// Uses the first two words: the first given name alone is often unisex in the
// DR ("EUDY ALEXANDRA", "ODALIS ANTONIO") while the second settles it.
export const inferSex = async (lines, errors) => {
    const missing = lines.filter(l => !l.sex)
    if (missing.length === 0) return
    const cache = await loadJson(sexFile)
    const keyOf = (line) => givenNamesOf(line.name).join(' ')
    const unknown = [...new Set(missing.map(keyOf).filter(k => k && !(k in cache)))]

    await classifyNames(unknown, cache, errors)
    await saveJson(sexFile, cache)

    for (const line of missing) {
        const sex = cache[keyOf(line)]
        if (sex) {
            line.sex = sex
            line.sexInferred = true
        }
    }
}

// ── workbook ─────────────────────────────────────────────────────────────────

const tryModel = async (rows, sheetName, errors) => {
    try {
        const mapping = await askMapping(previewRows(rows).text, sheetName)
        return { mapping, valid: mapping.isPayroll ? validateMapping(rows, mapping) : null }
    } catch (err) {
        if (err instanceof UsageLimitReached) throw err
        errors.push({ step: 'mapColumns', sheet: sheetName, error: err.message })
        return null
    }
}

// Cache entries: { mapping, headerOffset, ok } — `ok` records whether the
// model mapping passed validation, so layouts where it failed go straight to
// the rules. The header row is stored relative to the layout anchor.
const resolveMapping = async (rows, sheetName, cache, errors) => {
    const { signature, anchorRow } = layoutSignature(rows)
    const cached = cache[signature]
    let attempt = null
    let source = 'model (cached)'

    if (cached?.mapping && !cached.mapping.isPayroll) {
        return { skip: true, reason: 'model: not a payroll sheet', notes: cached.mapping.notes }
    }
    if (cached?.ok) {
        const mapping = { ...cached.mapping, headerRow: anchorRow + cached.headerOffset }
        const valid = validateMapping(rows, mapping)
        // Same layout, different data: ask again once.
        attempt = valid ? { mapping, valid } : await tryModel(rows, sheetName, errors)
        if (!valid) source = 'model'
    } else if (!cached) {
        attempt = await tryModel(rows, sheetName, errors)
        source = 'model'
    }
    if (attempt && source === 'model') {
        cache[signature] = {
            mapping: attempt.mapping,
            headerOffset: (attempt.mapping.headerRow ?? anchorRow) - anchorRow,
            ok: Boolean(attempt.valid),
        }
    }

    if (attempt && !attempt.mapping.isPayroll) {
        return { skip: true, reason: 'model: not a payroll sheet', notes: attempt.mapping.notes }
    }
    if (attempt?.valid) return { mapping: attempt.valid, source }

    const detected = detectHeader(rows)
    const fallback = detected && validateMapping(rows, detected)
    if (fallback) return { mapping: fallback, source: 'rules' }

    return { skip: true, reason: 'no usable column mapping', notes: (attempt ?? cached)?.mapping?.notes }
}

export const processSpreadsheet = async (buffer) => {
    const workbook = readWorkbook(buffer)
    const cache = await loadJson(mappingsFile)
    const errors = []
    const lines = []
    const sheets = []

    for (const sheetName of workbook.SheetNames) {
        const rows = sheetRows(workbook.Sheets[sheetName])
        if (!rows.some(r => r.some(c => norm(c) !== ''))) continue

        const resolved = await resolveMapping(rows, sheetName, cache, errors)
        if (resolved.skip) {
            sheets.push({ sheet: sheetName, rows: rows.length, payroll: false, reason: resolved.reason, notes: resolved.notes })
            continue
        }
        const { mapping, source } = resolved
        const result = extractRows(rows, mapping)
        for (const line of result.lines) line.sheet = sheetName
        lines.push(...result.lines)
        sheets.push({
            sheet: sheetName,
            rows: rows.length,
            payroll: true,
            mappingSource: source,
            headerRow: mapping.headerRow + 1,
            columns: mapping.columns,
            droppedColumns: mapping.dropped,
            notes: mapping.notes,
            extracted: result.lines.length,
            skipped: result.skipped,
        })
    }
    await saveJson(mappingsFile, cache)

    await inferSex(lines, errors)

    return { lines, sheets, errors }
}
