import { createHash } from 'crypto'
import { mkdir, readFile, writeFile, rm, rename } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { anthropic, readJson, usageCost } from './llm.js'
import {
    openPdf, openPdfFile, pageText, pageInputs, pageParams, layoutParams, pageResult,
    countMalformed, linkAcrossPages, FAILED_LAYOUT,
} from './pdf.js'

// PDF extraction through the Message Batches API (half price, results within
// 24 hours). The run is a resumable state machine stored under
// aiProcess/batches/: running `--batch` again continues where it stopped.
//
//   1. discover   list the PDFs and pages to process, cache the PDFs locally
//   2. layout     one request per document (how "Cargo:" lines are laid out)
//   3. pages      one request per page, with the document layout as context;
//                 rotated pages and pages with malformed rows go round again
//   4. finalize   when every page of a document is answered: build the lines,
//                 link labels across pages, write to MinIO
//
// Pages that fail for good are not written, so a normal (synchronous) run
// picks them up later.

const baseDir = join(dirname(fileURLToPath(import.meta.url)), 'batches')
const stateFile = join(baseDir, 'state.json')
const pdfDir = join(baseDir, 'pdf')
const answersDir = join(baseDir, 'answers')

const POLL_MS = 60_000
const MAX_BATCH_BYTES = 100 * 1024 * 1024 // API limit is 256 MB; stay well below
const MAX_BATCH_REQUESTS = 10_000
const MAX_ATTEMPTS = 3
const RENDER_CONCURRENCY = 6

const docIdOf = (downloadKey) => createHash('sha1').update(downloadKey).digest('hex').slice(0, 16)
const pageId = (docId, pageIndex) => `${docId}-${pageIndex}`
// custom_id must match ^[a-zA-Z0-9_-]{1,64}$
const layoutCustomId = (docId, attempt) => `L-${docId}-a${attempt}`
const pageCustomId = (docId, pageIndex, attempt) => `P-${docId}-${pageIndex}-a${attempt}`

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const readJsonFile = async (file) => {
    try { return JSON.parse(await readFile(file, 'utf-8')) } catch { return null }
}

const saveState = async (state) => {
    await mkdir(baseDir, { recursive: true })
    await writeFile(`${stateFile}.tmp`, JSON.stringify(state, null, 1))
    await rename(`${stateFile}.tmp`, stateFile)
}

const answerFile = (id) => join(answersDir, `${id}.json`)
const loadAnswers = async (id) => (await readJsonFile(answerFile(id))) ?? {}
const saveAnswers = async (id, answers) => {
    await mkdir(answersDir, { recursive: true })
    await writeFile(answerFile(id), JSON.stringify(answers))
}

const mapLimit = async (items, limit, fn) => {
    const results = new Array(items.length)
    let next = 0
    const worker = async () => {
        while (next < items.length) {
            const i = next++
            results[i] = await fn(items[i], i)
        }
    }
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
    return results
}

// ── 1. discover ──────────────────────────────────────────────────────────────

const discover = async ({ downloadKeys, fm, force, page, pageKeyOf }) => {
    const state = { version: 1, startedAt: new Date().toISOString(), docs: {}, pages: {}, batches: [], usage: [] }
    await mkdir(pdfDir, { recursive: true })
    for (const downloadKey of downloadKeys) {
        const docId = docIdOf(downloadKey)
        const buffer = await fm.getFile(downloadKey)
        let pdf
        try {
            pdf = await openPdf(buffer)
        } catch (err) {
            console.log(`  Skipping (cannot open PDF: ${err.message}): ${downloadKey}`)
            continue
        }
        await pdf.close()
        const wanted = page !== null ? [page].filter(p => p >= 0 && p < pdf.pageCount) : Array.from({ length: pdf.pageCount }, (_, i) => i)
        const pages = []
        let layout = null
        for (const pageIndex of wanted) {
            const existing = await fm.fileExists(pageKeyOf(downloadKey, pageIndex))
            if (existing && !force) {
                // Reuse the layout of an already processed page (new format only).
                if (!layout) {
                    const data = await readPageResult(fm, pageKeyOf(downloadKey, pageIndex))
                    if (data?.page?.layout) layout = { recordLayout: data.page.layout, evidence: data.page.layoutEvidence ?? '' }
                }
                continue
            }
            pages.push(pageIndex)
            state.pages[pageId(docId, pageIndex)] = { docId, pageIndex, status: 'pending', attempts: 0, rotation: 0 }
        }
        if (pages.length === 0) continue
        await writeFile(join(pdfDir, `${docId}.pdf`), buffer)
        state.docs[docId] = { downloadKey, pageCount: pdf.pageCount, pages, layout, layoutStatus: layout ? 'done' : 'pending', layoutAttempts: 0, finalized: false }
        console.log(`  ${downloadKey}: ${pages.length} page(s) to process`)
    }
    return state
}

const readPageResult = async (fm, key) => {
    try { return JSON.parse((await fm.getFile(key)).toString('utf-8')) } catch { return null }
}

// ── 2/3. submit ──────────────────────────────────────────────────────────────

const withPdf = async (docId, fn) => {
    const pdf = await openPdfFile(join(pdfDir, `${docId}.pdf`))
    try { return await fn(pdf) } finally { await pdf.close() }
}

// Sends the requests produced by `build` in chunks that respect the batch
// limits. `build(item)` returns { custom_id, params } or null to skip.
// `onSubmitted(items, batchId)` records the chunk in the state before the
// next chunk is built.
const submitInChunks = async (state, kind, items, build, onSubmitted) => {
    let chunk = []
    let chunkItems = []
    let bytes = 0
    const flush = async () => {
        if (chunk.length === 0) return
        const batch = await anthropic.messages.batches.create({ requests: chunk }, { timeout: 30 * 60 * 1000 })
        state.batches.push({ id: batch.id, kind, requests: chunk.length, submittedAt: new Date().toISOString(), collected: false })
        onSubmitted(chunkItems, batch.id)
        await saveState(state)
        console.log(`  Submitted ${kind} batch ${batch.id} with ${chunk.length} request(s)`)
        chunk = []
        chunkItems = []
        bytes = 0
    }
    // Build in parallel groups (rendering is the slow part), submit in order.
    for (let i = 0; i < items.length; i += RENDER_CONCURRENCY * 4) {
        const group = items.slice(i, i + RENDER_CONCURRENCY * 4)
        const built = await mapLimit(group, RENDER_CONCURRENCY, build)
        for (let j = 0; j < group.length; j++) {
            const request = built[j]
            if (!request) continue
            const size = Buffer.byteLength(JSON.stringify(request))
            if (chunk.length && (bytes + size > MAX_BATCH_BYTES || chunk.length >= MAX_BATCH_REQUESTS)) await flush()
            chunk.push(request)
            chunkItems.push(group[j])
            bytes += size
        }
    }
    await flush()
}

const submitLayouts = async (state) => {
    const docIds = Object.keys(state.docs).filter(id => state.docs[id].layoutStatus === 'pending')
    if (docIds.length === 0) return
    console.log(`\nSubmitting layout detection for ${docIds.length} document(s)`)
    await submitInChunks(state, 'layout', docIds, async (docId) => {
        const doc = state.docs[docId]
        try {
            const params = await withPdf(docId, layoutParams)
            return { custom_id: layoutCustomId(docId, doc.layoutAttempts), params }
        } catch (err) {
            console.error(`  Layout request failed to build for ${doc.downloadKey}: ${err.message}`)
            doc.layout = FAILED_LAYOUT
            doc.layoutStatus = 'done'
            return null
        }
    }, (ids, batchId) => {
        for (const docId of ids) Object.assign(state.docs[docId], { layoutStatus: 'submitted', layoutBatch: batchId })
    })
}

const submitPages = async (state) => {
    const ids = Object.keys(state.pages).filter(id => {
        const page = state.pages[id]
        return page.status === 'pending' && state.docs[page.docId].layoutStatus === 'done'
    })
    if (ids.length === 0) return
    console.log(`\nSubmitting ${ids.length} page(s)`)
    await submitInChunks(state, 'pages', ids, async (id) => {
        const page = state.pages[id]
        const doc = state.docs[page.docId]
        try {
            const params = await withPdf(page.docId, async (pdf) => {
                const inputs = await pageInputs(pdf, page.pageIndex, page.rotation)
                return pageParams({ ...inputs, context: { layout: doc.layout } })
            })
            return { custom_id: pageCustomId(page.docId, page.pageIndex, page.attempts), params }
        } catch (err) {
            if (page.rotation) {
                // Could not straighten the page: keep the answer read as is.
                page.notes = [...(page.notes ?? []), `could not rotate page (${err.message}); read as is`]
                page.rotation = 0
                page.rotationFailed = true
                page.useFallback = true
                page.status = 'done'
            } else {
                page.status = 'failed'
                page.error = `could not render page: ${err.message}`
            }
            return null
        }
    }, (pageIds, batchId) => {
        for (const id of pageIds) Object.assign(state.pages[id], { status: 'submitted', batch: batchId })
    })
}

// ── collect ──────────────────────────────────────────────────────────────────

const parseCustomId = (customId) => {
    const layout = /^L-([0-9a-f]+)-a(\d+)$/.exec(customId)
    if (layout) return { kind: 'layout', docId: layout[1] }
    const page = /^P-([0-9a-f]+)-(\d+)-a(\d+)$/.exec(customId)
    if (page) return { kind: 'page', docId: page[1], pageIndex: Number(page[2]) }
    return null
}

// A page that already has a usable earlier answer (read before rotating, or
// with malformed rows) keeps that answer instead of failing.
const giveUp = (page, error) => {
    page.error = error
    if (!page.fallback) {
        page.status = 'failed'
        return
    }
    if (page.fallback === 'unrotated') page.rotation = 0
    page.notes = [...(page.notes ?? []), `re-read failed (${error}); kept the earlier answer`]
    page.useFallback = true
    page.status = 'done'
}

const retryOrFail = (page, error) => {
    page.attempts++
    if (page.attempts >= MAX_ATTEMPTS) giveUp(page, error)
    else {
        page.error = error
        page.status = 'pending'
    }
}

const handlePageAnswer = async (state, page, message) => {
    const id = pageId(page.docId, page.pageIndex)
    state.usage.push(message.usage)
    const answers = await loadAnswers(id)
    answers.usage = [...(answers.usage ?? []), message.usage]
    let answer
    try {
        answer = readJson(message)
    } catch (err) {
        // Refusals and truncated answers are not retried in batch; a normal
        // run (with server-side fallbacks) can take them later.
        giveUp(page, err.message)
        await saveAnswers(id, answers)
        return
    }

    if (answer.rotation !== 0 && page.rotation === 0 && !page.rotationFailed) {
        answers.unrotated = answer
        page.fallback = 'unrotated'
        page.rotation = answer.rotation
        page.notes = [...(page.notes ?? []), `page rotated ${answer.rotation}° before reading`]
        page.attempts++
        page.status = 'pending'
    } else if (countMalformed(answer) > 0 && !page.malformedRetried) {
        answers.candidate = answer
        page.fallback = 'candidate'
        page.malformedRetried = true
        page.attempts++
        page.status = 'pending'
    } else {
        if (answers.candidate && countMalformed(answers.candidate) < countMalformed(answer)) {
            answer = answers.candidate
        } else if (page.malformedRetried) {
            page.notes = [...(page.notes ?? []), 're-read after malformed rows']
        }
        if (page.rotation && answer.rotation !== 0) page.notes = [...(page.notes ?? []), `still reported rotation ${answer.rotation}`]
        answers.final = answer
        page.status = 'done'
    }
    await saveAnswers(id, answers)
}

const collectBatch = async (state, entry) => {
    for await (const result of await anthropic.messages.batches.results(entry.id)) {
        const parsed = parseCustomId(result.custom_id)
        if (!parsed) continue
        const ok = result.result.type === 'succeeded'
        const failure = ok ? null : `${result.result.type}${result.result.error ? `: ${JSON.stringify(result.result.error)}` : ''}`

        if (parsed.kind === 'layout') {
            const doc = state.docs[parsed.docId]
            if (!doc || doc.layoutStatus !== 'submitted') continue
            if (ok) {
                state.usage.push(result.result.message.usage)
                try {
                    doc.layout = readJson(result.result.message)
                    doc.layoutStatus = 'done'
                    console.log(`  Layout ${doc.layout.recordLayout}: ${doc.downloadKey}`)
                    continue
                } catch (err) {
                    doc.layoutError = err.message
                }
            }
            doc.layoutAttempts++
            doc.layoutError = failure ?? doc.layoutError
            if (doc.layoutAttempts >= MAX_ATTEMPTS || ok) {
                doc.layout = FAILED_LAYOUT
                doc.layoutStatus = 'done'
            } else {
                doc.layoutStatus = 'pending'
            }
            continue
        }

        const page = state.pages[pageId(parsed.docId, parsed.pageIndex)]
        if (!page || page.status !== 'submitted' || page.batch !== entry.id) continue
        if (ok) await handlePageAnswer(state, page, result.result.message)
        else retryOrFail(page, failure)
    }

    // Anything submitted in this batch without a result goes round again.
    for (const page of Object.values(state.pages)) {
        if (page.status === 'submitted' && page.batch === entry.id) retryOrFail(page, 'missing from batch results')
    }
    for (const doc of Object.values(state.docs)) {
        if (doc.layoutStatus === 'submitted' && doc.layoutBatch === entry.id) {
            doc.layoutAttempts++
            doc.layoutStatus = doc.layoutAttempts >= MAX_ATTEMPTS ? 'done' : 'pending'
            if (doc.layoutStatus === 'done') doc.layout = FAILED_LAYOUT
        }
    }
    entry.collected = true
    await saveState(state)
}

const collectFinished = async (state) => {
    for (const entry of state.batches.filter(b => !b.collected)) {
        const batch = await anthropic.messages.batches.retrieve(entry.id)
        entry.status = batch.processing_status
        entry.counts = batch.request_counts
        if (batch.processing_status !== 'ended') continue
        console.log(`\nCollecting ${entry.kind} batch ${entry.id} (${JSON.stringify(batch.request_counts)})`)
        await collectBatch(state, entry)
    }
}

// ── 4. finalize ──────────────────────────────────────────────────────────────

const finalizeDocs = async (state, { fm, pageKeyOf, saveError }) => {
    for (const [docId, doc] of Object.entries(state.docs)) {
        if (doc.finalized || doc.layoutStatus !== 'done') continue
        const pages = doc.pages.map(i => state.pages[pageId(docId, i)])
        if (pages.some(p => p.status !== 'done' && p.status !== 'failed')) continue

        console.log(`\nFinalizing ${doc.downloadKey}`)
        await withPdf(docId, async (pdf) => {
            const results = new Map()
            for (const page of pages) {
                if (page.status !== 'done') continue
                const answers = await loadAnswers(pageId(docId, page.pageIndex))
                const answer = page.useFallback ? answers[page.fallback] : answers.final
                if (!answer) {
                    page.status = 'failed'
                    page.error = 'no answer stored'
                    continue
                }
                results.set(page.pageIndex, pageResult(answer, {
                    pageIndex: page.pageIndex,
                    text: await pageText(pdf, page.pageIndex),
                    layout: doc.layout,
                    rotation: page.rotation,
                    usage: answers.usage ?? [],
                    extraNotes: page.notes ?? [],
                }))
            }

            // Labels printed on a neighbouring page, in page order. A previous
            // page outside this run is read from MinIO (new format only).
            for (const pageIndex of [...results.keys()].sort((a, b) => a - b)) {
                const current = results.get(pageIndex)
                let previous = results.get(pageIndex - 1)
                let previousKey = null
                if (!previous && pageIndex > 0) {
                    previousKey = pageKeyOf(doc.downloadKey, pageIndex - 1)
                    const stored = await readPageResult(fm, previousKey)
                    previous = stored?.page ? stored : null
                }
                if (linkAcrossPages(previous, current) && previousKey) {
                    await fm.createTextFile(previousKey, JSON.stringify(previous))
                    console.log(`  Updated previous page with labels printed on the next page: ${previousKey}`)
                }
            }

            for (const [pageIndex, result] of results) {
                await fm.createTextFile(pageKeyOf(doc.downloadKey, pageIndex), JSON.stringify(result))
            }
            const failed = pages.filter(p => p.status === 'failed')
            for (const page of failed) {
                await saveError({ source: 'pdf-batch', downloadKey: doc.downloadKey, pageIndex: page.pageIndex }, page.error ?? 'failed')
            }
            const review = [...results.values()].reduce((n, r) => n + r.page.needsReview, 0)
            console.log(`  Saved ${results.size} page(s), ${review} row(s) to review, ${failed.length} page(s) failed (a normal run will retry them)`)
        })

        doc.finalized = true
        await saveState(state)
        await rm(join(pdfDir, `${docId}.pdf`), { force: true })
        for (const pageIndex of doc.pages) await rm(answerFile(pageId(docId, pageIndex)), { force: true })
    }
}

// ── run ──────────────────────────────────────────────────────────────────────

const summarize = (state) => {
    const pages = Object.values(state.pages)
    const count = (status) => pages.filter(p => p.status === status).length
    const inFlight = state.batches.filter(b => !b.collected)
    const totals = state.usage.reduce((t, u) => {
        const c = usageCost(u, { batch: true })
        return { input: t.input + c.input, output: t.output + c.output, cost: t.cost + c.cost }
    }, { input: 0, output: 0, cost: 0 })
    console.log(`Pages: ${count('done')} done, ${count('failed')} failed, ${count('pending')} pending, ${count('submitted')} in batches` +
        ` | batches in flight: ${inFlight.map(b => `${b.id} ${b.status ?? ''} ${b.counts ? JSON.stringify(b.counts) : ''}`).join(', ') || 'none'}` +
        ` | tokens in/out ${totals.input}/${totals.output}, cost so far $${totals.cost.toFixed(2)} (batch price)`)
    return { inFlight: inFlight.length, pending: count('pending') + Object.values(state.docs).filter(d => d.layoutStatus === 'pending').length }
}

export const runPdfBatch = async ({ downloadKeys, fm, force, page, pageKeyOf, saveError }) => {
    let state = await readJsonFile(stateFile)
    if (state) {
        console.log(`Resuming batch run started ${state.startedAt} (${Object.keys(state.docs).length} document(s)).`)
        console.log(`Filters of this command are ignored; delete ${stateFile} to start a new run.`)
    } else {
        console.log(`Preparing batch run for ${downloadKeys.length} PDF(s)`)
        state = await discover({ downloadKeys, fm, force, page, pageKeyOf })
        await saveState(state)
    }

    while (true) {
        await collectFinished(state)
        await submitLayouts(state)
        await submitPages(state)
        await saveState(state)
        await finalizeDocs(state, { fm, pageKeyOf, saveError })
        const { inFlight, pending } = summarize(state)
        if (inFlight === 0 && pending === 0) break
        await sleep(POLL_MS)
    }

    const done = join(baseDir, `done-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
    await rename(stateFile, done)
    console.log(`\nBatch run complete. State archived to ${done}`)
}
