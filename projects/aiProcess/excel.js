import { createHash } from 'crypto'
import { read as xlsxRead, utils as xlsxUtils } from 'xlsx'

// Deterministic payroll extraction for spreadsheets (xlsx/xls/csv/...).
// Values are always read straight from the cells — a model may decide which
// column is which (see spreadsheet.js), but never rewrites names or amounts.

export const SPREADSHEET_EXTENSIONS = ['xlsx', 'xls', 'xlsm', 'xlsb', 'ods', 'csv']

export const FIELDS = ['name', 'document', 'position', 'income', 'sex', 'accountBack', 'phoneNumber']

const HEADER_SCAN_ROWS = 40
const SAMPLE_ROWS = 200

export const norm = (value) => String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

const cleanText = (value) => String(value ?? '').replace(/\s+/g, ' ').trim()

const isBlank = (value) => norm(value) === ''

// ── value parsing ────────────────────────────────────────────────────────────

export const isHonorific = (value) => /honorifico/.test(norm(value))

// Returns a number, or null when the value cannot be read unambiguously.
export const parseAmount = (value) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null
    const s = String(value ?? '').replace(/rd\$|\$|\s/gi, '')
    if (s === '' || s === '-') return null
    if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s)
    // 1,234,567.89
    if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) return Number(s.replace(/,/g, ''))
    // 1.234.567,89 or 1234,89
    if (/^-?\d{1,3}(\.\d{3})*,\d{1,2}$/.test(s) || /^-?\d+,\d{1,2}$/.test(s)) {
        return Number(s.replace(/\./g, '').replace(',', '.'))
    }
    // 1,298,000,00 (thousands and decimals both written with commas)
    if (/^-?\d{1,3}(,\d{3})*,\d{2}$/.test(s)) {
        const lastComma = s.lastIndexOf(',')
        return Number(s.slice(0, lastComma).replace(/,/g, '') + '.' + s.slice(lastComma + 1))
    }
    return null
}

const parseSex = (value) => {
    const s = norm(value)
    if (/^(m|masc)/.test(s) || s === 'hombre') return 'M'
    if (/^(f|fem)/.test(s) || s === 'mujer') return 'F'
    return ''
}

// Cédulas stored as numbers lose their leading zeros.
const parseDocument = (value) => {
    if (isBlank(value)) return ''
    if (typeof value === 'number') return String(value).padStart(11, '0')
    return cleanText(value)
}

const parseDigits = (value) => {
    if (isBlank(value)) return ''
    if (typeof value === 'number') return BigInt(Math.round(value)).toString()
    return String(value).replace(/\D/g, '')
}

// Some exports merge the hire date into the name cell ("JUAN PEREZ   0000-00-00")
// or leave a stray trailing dot ("JUAN PEREZ .").
const cleanName = (value) => cleanText(value)
    .replace(/\s*\d{4}-\d{2}-\d{2}$/, '')
    .replace(/\s+\.$/, '')

const readName = (row, nameColumns) =>
    nameColumns.map(i => cleanName(row[i])).filter(Boolean).join(' ')

// ── content checks ───────────────────────────────────────────────────────────

const looksLike = {
    name: v => /[a-z]{2,}.*\s+.*[a-z]{2,}/.test(norm(v)),
    income: v => parseAmount(v) !== null || isHonorific(v),
    position: v => /[a-z]{2,}/.test(norm(v)),
    document: v => /^\d{3}-?\d{7}-?\d$/.test(cleanText(v)) || (typeof v === 'number' && v < 1e11 && v >= 1e8),
    sex: v => parseSex(v) !== '',
    accountBack: v => parseDigits(v).length >= 5,
    phoneNumber: v => parseDigits(v).length >= 7,
}

// Share of rows (that have any value in the column) whose value fits the field.
const matchRate = (rows, index, field) => {
    const filled = rows.filter(r => !isBlank(r[index]))
    if (filled.length === 0) return 0
    return filled.filter(r => looksLike[field](r[index])).length / filled.length
}

// Share of rows where the column has a value that fits the field.
const fillRate = (rows, index, field) => {
    if (rows.length === 0) return 0
    return rows.filter(r => !isBlank(r[index]) && looksLike[field](r[index])).length / rows.length
}

const isTotalRow = (name) => /^(sub ?)?totale?s?\b|^gran total/.test(norm(name))

const sampleRows = (rows, headerRow, nameColumns) =>
    rows.slice(headerRow + 1)
        .filter(r => {
            const name = readName(r, nameColumns)
            return looksLike.name(name) && !isTotalRow(name)
        })
        .slice(0, SAMPLE_ROWS)

// Checks a mapping against the sheet content. Returns the mapping with the
// optional columns whose content does not fit removed (e.g. an employee card
// number mapped as cédula), or null when name/income are not usable.
export const validateMapping = (rows, mapping) => {
    const { headerRow, columns } = mapping
    if (!Number.isInteger(headerRow) || !columns.name?.length || columns.income === undefined) return null
    const sample = sampleRows(rows, headerRow, columns.name)
    if (sample.length === 0) return null
    const incomeRate = sample.filter(r => looksLike.income(r[columns.income])).length / sample.length
    if (incomeRate < 0.6) return null

    const checked = { name: columns.name, income: columns.income }
    const dropped = []
    for (const field of ['document', 'position', 'sex', 'accountBack', 'phoneNumber']) {
        if (columns[field] === undefined) continue
        if (matchRate(sample, columns[field], field) >= 0.8) checked[field] = columns[field]
        else dropped.push(field)
    }
    return { ...mapping, columns: checked, dropped }
}

// ── rule-based header detection (fallback when no model mapping is usable) ──

// Ordered by priority: the first matching pattern wins when several columns match.
const FIELD_PATTERNS = {
    name: [/^n[aeo]mbres?\b/, /^empleados?\b/, /n[aeo]mbres? y apellidos?/, /^(fecha )?empleado/, /^servidor/],
    document: [/cedula/, /^documento/, /identificacion/],
    position: [/^cargo\b/, /^puesto/, /^posicion/, /^funcion\b/, /^ocupacion/, /^rango\b/],
    income: [/bruto/, /^(sueldo|salario)( (base|mensual))?( rd\$?)?$/, /^total ing/, /^(ingreso|sueldo|salario)s?\b/, /^monto\b/],
    sex: [/^sexo/, /^genero/],
    accountBack: [/cuenta/],
    phoneNumber: [/telefono/, /celular/],
}

const NOT_FIELD = {
    name: /tipo/,
    income: /fecha|neto|otros|desc|isr|afp|sfs/,
}

const findColumn = (header, field) => {
    for (const pattern of FIELD_PATTERNS[field]) {
        const index = header.findIndex(h => h && pattern.test(h) && !NOT_FIELD[field]?.test(h))
        if (index !== -1) return index
    }
    return -1
}

const mapHeader = (row) => {
    const header = row.map(norm)
    const columns = {}
    for (const field of FIELDS) {
        const index = findColumn(header, field)
        if (index !== -1) columns[field] = index
    }
    return columns
}

// Joins `span` rows column by column, for headers split across several rows.
const combineRows = (rows, start, span) => {
    const width = Math.max(0, ...rows.slice(start, start + span).map(r => r.length))
    return Array.from({ length: width }, (_, j) =>
        rows.slice(start, start + span).map(r => cleanText(r[j])).filter(Boolean).join(' '))
}

// Exports converted from PDF often shift data one or two cells away from the
// header text. When the mapped column is mostly empty, move to a neighbouring
// column whose header is blank and whose content matches the field.
const realignColumns = (columns, header, rows, headerRow) => {
    const sample = sampleRows(rows, headerRow, [columns.name])
    const fixed = { ...columns }
    for (const [field, index] of Object.entries(columns)) {
        if (field === 'name') continue
        const rate = fillRate(sample, index, field)
        if (rate >= 0.5) continue
        let best = { index, rate }
        for (const offset of [1, -1, 2, -2]) {
            const candidate = index + offset
            if (candidate < 0 || !isBlank(header[candidate])) continue
            const candidateRate = fillRate(sample, candidate, field)
            if (candidateRate > best.rate) best = { index: candidate, rate: candidateRate }
        }
        fixed[field] = best.index
    }
    return fixed
}

// Single-row headers are tried on the whole scan window before multi-row ones,
// so a title row is never glued onto a real header.
export const detectHeader = (rows) => {
    const limit = Math.min(rows.length, HEADER_SCAN_ROWS)
    for (const span of [1, 2, 3]) {
        for (let i = 0; i < limit; i++) {
            const header = combineRows(rows, i, span)
            const columns = mapHeader(header)
            if (columns.name === undefined || columns.income === undefined) continue
            const headerRow = i + span - 1
            const aligned = realignColumns(columns, header, rows, headerRow)
            return { headerRow, header, columns: { ...aligned, name: [aligned.name] } }
        }
    }
    return null
}

// ── sheet reading ────────────────────────────────────────────────────────────

export const readWorkbook = (buffer) => xlsxRead(buffer, { type: 'buffer' })

export const sheetRows = (sheet) =>
    xlsxUtils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: true, raw: true })

const looksLikeDataRow = (row) =>
    row.some(c => typeof c === 'number' && Math.abs(c) >= 1000) &&
    row.some(c => typeof c === 'string' && looksLike.name(c))

// Rows shown to a model to map columns: everything before the first data row
// plus a few data rows. Only non-empty cells, tagged with their column index.
export const previewRows = (rows, dataRowsToShow = 8) => {
    let firstData = rows.findIndex(looksLikeDataRow)
    if (firstData === -1) firstData = Math.min(rows.length, HEADER_SCAN_ROWS)
    const end = Math.min(rows.length, firstData + dataRowsToShow, HEADER_SCAN_ROWS + dataRowsToShow)
    const lines = []
    for (let i = 0; i < end; i++) {
        const cells = rows[i]
            .map((c, j) => isBlank(c) ? null : `[c${j}] ${cleanText(c).slice(0, 50)}`)
            .filter(Boolean)
        if (cells.length) lines.push(`r${i}: ${cells.join(' | ')}`)
    }
    return { text: lines.join('\n'), firstData }
}

const signatureText = (value) => norm(value)
    .replace(/enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre/g, '')
    .replace(/[^a-z]/g, '')

// Identifies a sheet layout so the same layout in different months shares one
// cached mapping: the header cells with their column positions when a header
// is recognisable, otherwise the whole region above the first data row.
// `anchorRow` is where the layout starts in this sheet; cached header rows are
// stored relative to it because titles above the header vary between months.
export const layoutSignature = (rows) => {
    const detected = detectHeader(rows)
    let text
    let anchorRow = 0
    if (detected) {
        anchorRow = detected.headerRow
        text = 'header:' + detected.header.map((c, j) => c ? `${j}=${signatureText(c)}` : '').filter(Boolean).join('|')
    } else {
        const { firstData } = previewRows(rows, 0)
        text = 'region:' + rows.slice(0, firstData)
            .map(r => r.map((c, j) => isBlank(c) ? '' : `${j}=${signatureText(c)}`).filter(Boolean).join('|'))
            .join('\n')
    }
    return { signature: createHash('sha1').update(text).digest('hex'), anchorRow }
}

export const extractRows = (rows, { headerRow, columns }) => {
    const lines = []
    let skipped = 0
    const get = (row, field) => columns[field] === undefined ? '' : row[columns[field]]
    for (let i = headerRow + 1; i < rows.length; i++) {
        const row = rows[i]
        const name = readName(row, columns.name)
        const incomeCell = row[columns.income]
        // A single-word name ("LILIANA") only counts when the row also has a
        // position or cédula, so department/subtotal rows are not taken as people.
        const singleName = /^[a-z]{3,}$/.test(norm(name)) &&
            (!isBlank(get(row, 'position')) || !isBlank(get(row, 'document')))
        if (!(looksLike.name(name) || singleName) || isTotalRow(name)) {
            if (row.some(c => !isBlank(c))) skipped++
            continue
        }
        const honorific = isHonorific(incomeCell)
        const amount = honorific ? null : parseAmount(incomeCell)
        if (!honorific && amount === null) {
            skipped++
            continue
        }
        lines.push({
            name,
            document: parseDocument(get(row, 'document')),
            position: cleanText(get(row, 'position')),
            income: honorific ? 'Honorífico' : String(amount),
            sex: parseSex(get(row, 'sex')),
            accountBack: parseDigits(get(row, 'accountBack')),
            phoneNumber: parseDigits(get(row, 'phoneNumber')),
            incomeRaw: cleanText(incomeCell),
            row: i + 1,
        })
    }
    return { lines, skipped }
}
