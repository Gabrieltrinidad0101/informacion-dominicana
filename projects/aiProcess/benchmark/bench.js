import 'dotenv/config'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'
import { FileManagerClient } from '../../shared/fileManagerClient.js'
import { openPdfFile, detectLayout, extractPage, pageInputs, pageRequest, pageResult, countMalformed } from '../pdf.js'
import { usageCost, anthropic, buildParams, readJson } from '../llm.js'
import { norm } from '../excel.js'

// Compares OpenRouter vision models against Claude on the same PDF pages,
// with the same prompt, schema and rotation/retry loop as pdf.js.
//
//   node projects/aiProcess/benchmark/bench.js --models qwen/qwen3.8-flash,z-ai/glm-5.3-flash [--cases id1,id2] [--force]
//
// Results are cached in benchmark/out/ (gitignored); --force re-runs them.

const here = dirname(fileURLToPath(import.meta.url))
const OUT = join(here, 'out')
const args = process.argv.slice(2)
const arg = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined }
const force = args.includes('--force')
const models = (arg('models') ?? '').split(',').filter(Boolean)
const onlyCases = arg('cases')?.split(',')
const concurrency = Number(arg('concurrency') ?? 6)

const fm = new FileManagerClient()
const cases = JSON.parse(await readFile(join(here, 'cases.json'), 'utf8')).filter(c => !onlyCases || onlyCases.includes(c.id))
const slug = (s) => s.replace(/[^a-zA-Z0-9.-]+/g, '_')

const cached = async (file, fn) => {
    if (!force && existsSync(file)) return JSON.parse(await readFile(file, 'utf8'))
    const value = await fn()
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, JSON.stringify(value, null, 2))
    return value
}

// ── OpenRouter ───────────────────────────────────────────────────────────────

const toOpenAiContent = (content) => content.map(block => block.type === 'image'
    ? { type: 'image_url', image_url: { url: `data:${block.source.media_type};base64,${block.source.data}` } }
    : { type: 'text', text: block.text })

// Same contract as llm.js askJson: returns the parsed JSON, reports usage.
const openRouterOnce = (model) => async ({ system, content, schema, maxTokens = 32000, onUsage }) => {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            messages: [{ role: 'system', content: system }, { role: 'user', content: toOpenAiContent(content) }],
            response_format: { type: 'json_schema', json_schema: { name: 'answer', strict: true, schema } },
            provider: { require_parameters: true },
            usage: { include: true },
        }),
        signal: AbortSignal.timeout(15 * 60 * 1000),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok || body.error) throw new Error(`OpenRouter ${res.status}: ${JSON.stringify(body.error ?? body).slice(0, 300)}`)
    const choice = body.choices?.[0]
    onUsage?.({ input_tokens: body.usage?.prompt_tokens, output_tokens: body.usage?.completion_tokens, cost: body.usage?.cost, provider: body.provider }, body.model)
    if (choice?.finish_reason === 'length') throw new Error('Response truncated at max_tokens')
    let text = choice?.message?.content ?? ''
    // Some providers wrap the JSON in a code fence despite response_format.
    text = text.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '')
    if (!text.trim()) throw new Error(`empty response (finish_reason ${choice?.finish_reason})`)
    const json = JSON.parse(text)
    // Not every provider enforces the schema; a missing key is a failure.
    const missing = (schema.required ?? []).filter(k => !(k in json))
    if (missing.length) throw new Error(`schema ignored, missing ${missing.join(',')}: ${text.slice(0, 200)}`)
    return json
}

// ── local Claude Code proxy ("proxy:<model>") ────────────────────────────────

// Anthropic Messages format at PROXY_URL. The proxy ignores output_config's
// JSON schema, so the schema also goes in the system prompt and the JSON is
// cut out of the answer text.
const PROXY_URL = process.env.PROXY_URL ?? 'http://127.0.0.1:8787'

const proxyOnce = (model) => async ({ system, content, schema, effort = 'high', maxTokens = 32000, onUsage }) => {
    const res = await fetch(`${PROXY_URL}/v1/messages`, {
        method: 'POST',
        headers: { 'x-api-key': 'local', 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            system: `${system}\n\nRespond with only a JSON object (no markdown, no prose) that matches this JSON schema:\n${JSON.stringify(schema)}`,
            output_config: { effort, format: { type: 'json_schema', schema } },
            messages: [{ role: 'user', content }],
        }),
        signal: AbortSignal.timeout(15 * 60 * 1000),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok || body.type === 'error') throw new Error(`proxy ${res.status}: ${JSON.stringify(body.error ?? body).slice(0, 300)}`)
    onUsage?.({ ...body.usage, cost: 0 }, body.model)
    if (body.stop_reason === 'max_tokens') throw new Error('Response truncated at max_tokens')
    const text = (body.content ?? []).filter(b => b.type === 'text').map(b => b.text).join('')
    const start = text.indexOf('{'), end = text.lastIndexOf('}')
    if (start < 0 || end < start) throw new Error(`no JSON in answer: ${text.slice(0, 200)}`)
    const json = JSON.parse(text.slice(start, end + 1))
    const missing = (schema.required ?? []).filter(k => !(k in json))
    if (missing.length) throw new Error(`schema ignored, missing ${missing.join(',')}: ${text.slice(0, 200)}`)
    return json
}

// ── Anthropic API ("anthropic:<model>") ──────────────────────────────────────

// Same request as llm.js askJson, with another model. Prices are USD per MTok.
const ANTHROPIC_PRICES = { 'claude-opus-5-5': [4, 20], 'claude-opus-5': [5, 25], 'claude-sonnet-5-5': [2, 10], 'claude-sonnet-5': [2, 10] }

const anthropicOnce = (model) => async ({ onUsage, ...request }) => {
    const stream = anthropic.beta.messages.stream({
        ...buildParams(request),
        model,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
    })
    const message = await stream.finalMessage()
    const [pin, pout] = ANTHROPIC_PRICES[model] ?? [0, 0]
    const input = (message.usage.input_tokens ?? 0) + (message.usage.cache_creation_input_tokens ?? 0) + (message.usage.cache_read_input_tokens ?? 0)
    onUsage?.({ ...message.usage, cost: (input * pin + message.usage.output_tokens * pout) / 1e6 }, message.model)
    return readJson(message)
}

// One retry: empty answers and invalid JSON happen intermittently with some providers.
const openRouterAsk = (model) => async (request) => {
    const once = model.startsWith('proxy:') ? proxyOnce(model.slice('proxy:'.length))
        : model.startsWith('anthropic:') ? anthropicOnce(model.slice('anthropic:'.length))
        : openRouterOnce(model)
    try {
        return await once(request)
    } catch (err) {
        console.log(`retry ${model}: ${err.message.slice(0, 120)}`)
        return once(request)
    }
}

// extractPage from pdf.js, with the ask function swapped.
const extractWith = async (ask, pdf, pageIndex, context) => {
    const usage = []
    const askPage = (inputs) => ask({ ...pageRequest({ ...inputs, context }), onUsage: (u) => usage.push(u) })
    const extraNotes = []
    let inputs = await pageInputs(pdf, pageIndex)
    let answer = await askPage(inputs)
    let rotation = 0
    if (answer.rotation !== 0) {
        rotation = answer.rotation
        inputs = await pageInputs(pdf, pageIndex, rotation)
        answer = await askPage(inputs)
        extraNotes.push(`page rotated ${rotation}° before reading`)
    }
    if (countMalformed(answer) > 0) {
        const retry = await askPage(inputs)
        if (countMalformed(retry) < countMalformed(answer)) answer = retry
    }
    return pageResult(answer, { pageIndex, text: inputs.text, layout: context?.layout, rotation, usage, extraNotes })
}

// ── scoring ──────────────────────────────────────────────────────────────────

const lev = (a, b) => {
    const d = Array.from({ length: b.length + 1 }, (_, i) => i)
    for (let i = 1; i <= a.length; i++) {
        let prev = d[0]; d[0] = i
        for (let j = 1; j <= b.length; j++) {
            const tmp = d[j]
            d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
            prev = tmp
        }
    }
    return d[b.length]
}
const sim = (a, b) => { a = norm(a); b = norm(b); return 1 - lev(a, b) / Math.max(a.length, b.length, 1) }
const digits = (s) => (s ?? '').replace(/\D/g, '')

// Greedy best-first matching of people by name similarity (>= 0.8).
const score = (ref, got) => {
    const r = ref.filter(l => l.name), g = got.filter(l => l.name)
    const pairs = []
    r.forEach((a, i) => g.forEach((b, j) => { const s = sim(a.name, b.name); if (s >= 0.8) pairs.push([s, i, j]) }))
    pairs.sort((x, y) => y[0] - x[0])
    const usedR = new Set(), usedG = new Set(), matches = []
    for (const [s, i, j] of pairs) if (!usedR.has(i) && !usedG.has(j)) { usedR.add(i); usedG.add(j); matches.push([r[i], g[j], s]) }
    const eq = (f) => matches.filter(([a, b]) => f(a, b)).length
    return {
        ref: r.length, got: g.length, matched: matches.length,
        nameExact: eq((a, b) => norm(a.name) === norm(b.name)),
        income: eq((a, b) => a.income === b.income),
        document: eq((a, b) => digits(a.document) === digits(b.document)),
        position: eq((a, b) => norm(a.position) === norm(b.position)),
        sex: eq((a, b) => a.sex === b.sex),
        diffs: matches.filter(([a, b]) => norm(a.name) !== norm(b.name) || a.income !== b.income || digits(a.document) !== digits(b.document))
            .slice(0, 8).map(([a, b]) => ({ ref: [a.name, a.document, a.income], got: [b.name, b.document, b.income] })),
        missing: r.filter((_, i) => !usedR.has(i)).map(l => l.name).slice(0, 8),
        extra: g.filter((_, j) => !usedG.has(j)).map(l => l.name).slice(0, 8),
    }
}

// ── run ──────────────────────────────────────────────────────────────────────

const pool = async (items, n, fn) => {
    const queue = [...items]
    await Promise.all(Array.from({ length: n }, async () => { while (queue.length) await fn(queue.shift()) }))
}

const pdfs = {}
const loadPdf = async (key) => {
    const file = join(OUT, 'pdf', createHash('sha1').update(key).digest('hex').slice(0, 16) + '.pdf')
    if (!existsSync(file)) { await mkdir(dirname(file), { recursive: true }); await writeFile(file, await fm.getFile(key)) }
    return (pdfs[key] ??= openPdfFile(file))
}

// Layout and reference per case. Stored references are the pipeline's
// existing Claude output; "opus" ones are produced here with llm.js.
const prepared = {}
for (const c of cases) {
    const pdf = await loadPdf(c.downloadKey)
    const layout = await cached(join(OUT, 'layout', slug(c.downloadKey) + '.json'), async () => {
        if (c.reference === 'stored') {
            const stored = JSON.parse(await fm.getFile(c.downloadKey.replace('/download/', '/aiProcess/').replace(/\.pdf$/i, `_page${c.pageIndex}.json`)))
            return { recordLayout: stored.page.layout, evidence: stored.page.layoutEvidence }
        }
        console.log(`layout (claude) ${c.id}`)
        return detectLayout(pdf)
    })
    const reference = await cached(join(OUT, 'reference', c.id + '.json'), async () => {
        if (c.reference === 'stored') {
            return JSON.parse(await fm.getFile(c.downloadKey.replace('/download/', '/aiProcess/').replace(/\.pdf$/i, `_page${c.pageIndex}.json`)))
        }
        console.log(`reference (claude) ${c.id}`)
        const t = Date.now()
        const result = await extractPage(pdf, c.pageIndex, { layout })
        result.page.seconds = (Date.now() - t) / 1000
        return result
    })
    prepared[c.id] = { pdf, layout, reference }
}

const jobs = models.flatMap(model => cases.map(c => ({ model, c })))
await pool(jobs, concurrency, async ({ model, c }) => {
    const file = join(OUT, 'results', slug(model), c.id + '.json')
    await cached(file, async () => {
        const { pdf, layout } = prepared[c.id]
        const t = Date.now()
        try {
            const result = await extractWith(openRouterAsk(model), pdf, c.pageIndex, { layout })
            result.page.seconds = (Date.now() - t) / 1000
            console.log(`ok   ${model} ${c.id} ${result.lines.length} lines ${result.page.seconds.toFixed(0)}s`)
            return result
        } catch (err) {
            console.log(`FAIL ${model} ${c.id}: ${err.message}`)
            return { error: err.message, seconds: (Date.now() - t) / 1000 }
        }
    })
})

// ── report ───────────────────────────────────────────────────────────────────

const pct = (a, b) => b ? `${(100 * a / b).toFixed(0)}%` : '-'
const claudeCost = (page) => (page.usage ?? []).reduce((s, u) => s + usageCost(u).cost, 0)
const report = { cases: {}, models: {} }
const table = []

// Every model run so far, so a report covers earlier runs too.
const seenFile = join(OUT, 'models.json')
const allModels = [...new Set([...(existsSync(seenFile) ? JSON.parse(await readFile(seenFile, 'utf8')) : []), ...models])]
await writeFile(seenFile, JSON.stringify(allModels, null, 2))

for (const model of allModels) {
    const tot = { ref: 0, got: 0, matched: 0, nameExact: 0, income: 0, document: 0, position: 0, sex: 0, cost: 0, seconds: 0, fails: 0, rotationOk: 0, verified: 0, verifiable: 0, pages: 0 }
    const perCase = {}
    for (const c of cases) {
        const file = join(OUT, 'results', slug(model), c.id + '.json')
        if (!existsSync(file)) continue
        const res = JSON.parse(await readFile(file, 'utf8'))
        const ref = prepared[c.id].reference
        tot.pages++
        if (res.error) { tot.fails++; perCase[c.id] = { error: res.error }; continue }
        const s = score(ref.lines, res.lines)
        for (const k of ['ref', 'got', 'matched', 'nameExact', 'income', 'document', 'position', 'sex']) tot[k] += s[k]
        tot.cost += res.page.usage.reduce((sum, u) => sum + (u.cost ?? 0), 0)
        tot.seconds += res.page.seconds
        tot.rotationOk += res.page.rotation === ref.page.rotation ? 1 : 0
        const v = res.lines.filter(l => l.verifiedByTextLayer !== null && l.verifiedByTextLayer !== undefined)
        tot.verifiable += v.length; tot.verified += v.filter(l => l.verifiedByTextLayer).length
        perCase[c.id] = s
    }
    report.models[model] = { totals: tot, perCase }
    table.push({
        model, pages: `${tot.pages - tot.fails}/${tot.pages}`,
        recall: pct(tot.matched, tot.ref), precision: pct(tot.matched, tot.got),
        nameExact: pct(tot.nameExact, tot.matched), income: pct(tot.income, tot.matched),
        cedula: pct(tot.document, tot.matched), cargo: pct(tot.position, tot.matched),
        textLayerOk: pct(tot.verified, tot.verifiable), rotOk: `${tot.rotationOk}/${tot.pages - tot.fails}`,
        'usd/page': (tot.cost / Math.max(tot.pages - tot.fails, 1)).toFixed(4),
        's/page': (tot.seconds / Math.max(tot.pages - tot.fails, 1)).toFixed(0),
    })
}

// Claude reference row (only for pages produced here, where cost/time are known).
const live = cases.filter(c => c.reference === 'opus')
if (live.length) {
    const refs = live.map(c => prepared[c.id].reference)
    const v = refs.flatMap(r => r.lines).filter(l => l.verifiedByTextLayer != null)
    table.push({ model: `claude (ref, ${live.length} live pages)`, pages: `${live.length}`, recall: 'ref', precision: 'ref', nameExact: 'ref', income: 'ref', cedula: 'ref', cargo: 'ref',
        textLayerOk: pct(v.filter(l => l.verifiedByTextLayer).length, v.length), rotOk: '-',
        'usd/page': (refs.reduce((s, r) => s + claudeCost(r.page), 0) / refs.length).toFixed(4),
        's/page': (refs.reduce((s, r) => s + (r.page.seconds ?? 0), 0) / refs.length).toFixed(0) })
}

console.table(table)
await writeFile(join(OUT, 'report.json'), JSON.stringify({ table, ...report }, null, 2))
console.log(`details: ${join(OUT, 'report.json')}`)
for (const p of Object.values(pdfs)) (await p).close()
