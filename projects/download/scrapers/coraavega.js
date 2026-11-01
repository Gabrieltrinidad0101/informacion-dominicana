const MONTHS = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
]

const SPREADSHEET_EXTENSIONS = ['.xlsx', '.xls', '.csv']

function parseMonth(text) {
    return MONTHS.find(m => text.toLowerCase().includes(m)) ?? "desconocido"
}

function parseYear(text) {
    return /\b(19|20)\d{2}\b/.exec(text)?.[0]
}

function isSpreadsheet(link) {
    const pathname = new URL(link).pathname.toLowerCase()
    return SPREADSHEET_EXTENSIONS.some(ext => pathname.endsWith(ext))
}

const FILLER_WORDS = new Set(['de', 'del', 'nomina'])

// Titles of the same document differ between formats ("Empleados fijos agosto 2022.pdf"
// vs "Empleados Fijos agosto 2022.xlsx", "... Julio 2021" vs "... Junio 2021"),
// so only the words that identify the document are compared.
function documentKey(title) {
    return title
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\.(pdf|xlsx?|csv)\s*$/, '')
        .replace(new RegExp(MONTHS.join('|'), 'g'), ' ')
        .split(/[^a-z]+/)
        .filter(word => word && !FILLER_WORDS.has(word))
        .join(' ')
}

// A month has one row per format of the same document.
// Keep the spreadsheets; fall back to the PDF only when a document has none.
function pickPreferredFiles(files) {
    const byTitle = new Map()
    for (const file of files) {
        const key = documentKey(file.title)
        if (!byTitle.has(key)) byTitle.set(key, [])
        byTitle.get(key).push(file)
    }

    const picked = []
    for (const group of byTitle.values()) {
        const spreadsheets = group.filter(f => isSpreadsheet(f.link))
        picked.push(...(spreadsheets.length > 0 ? spreadsheets : group))
    }
    return picked
}

const API_URL = 'https://backend.coraavega.gob.do/api/transparencia-contenido'

// The page is an Angular SPA that loads every folder and file from a single API call,
// so the API is read directly instead of clicking through each month.
function contentIdFromLink(institutionLink) {
    const id = /\/(\d+)-[^/]*$/.exec(new URL(institutionLink).hash)?.[1]
    if (!id) throw new Error(`No content id in link: ${institutionLink}`)
    return id
}

// The API returns links with a port (":9001") that does not respond; the site serves them without it.
function toDownloadUrl(enlace) {
    const url = new URL(enlace, 'https://backend.coraavega.gob.do')
    url.port = ''
    return url.href
}

export async function scrapeCoraavegaLinks(page, institutionLink) {
    const response = await fetch(`${API_URL}/${contentIdFromLink(institutionLink)}`)
    if (!response.ok) throw new Error(`Coraavega API ${response.status}`)
    const content = await response.json()

    const results = []
    for (const folder of content.folders ?? []) {
        for (const monthFolder of folder.folders ?? []) {
            const month = parseMonth(monthFolder.titulo)
            const files = (monthFolder.archivos ?? []).map(file => ({
                title: file.titulo,
                link: toDownloadUrl(file.enlace)
            }))

            for (const { link, title } of pickPreferredFiles(files)) {
                // Some folders are not named by year (e.g. "Programa de Modernización"),
                // the document title carries it instead.
                const year = parseYear(folder.titulo) ?? parseYear(title)
                if (!year) {
                    console.warn(`Skip (no year): ${title} ${link}`)
                    continue
                }
                results.push({ link, year, month })
            }
        }
    }

    return results
}
