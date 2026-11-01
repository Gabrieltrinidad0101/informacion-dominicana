import Anthropic from '@anthropic-ai/sdk'

export const CLAUDE_MODEL = 'claude-opus-5'

// Opus 5 list prices (USD per million tokens). The Batch API bills half.
export const PRICE_INPUT = 5
export const PRICE_OUTPUT = 25

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Optional local Claude Code proxy (Anthropic Messages format), e.g.
// ANTHROPIC_PROXY_URL=http://127.0.0.1:8787. It ignores output_config's JSON
// schema and betas, so in proxy mode the schema also goes in the system
// prompt and the JSON is cut out of the answer text. Retries are handled in
// askJson, which waits out usage limits instead of failing, unless
// ANTHROPIC_PROXY_STOP_ON_LIMIT=1 ends the run at the first usage limit.
const PROXY_URL = process.env.ANTHROPIC_PROXY_URL
const STOP_ON_LIMIT = process.env.ANTHROPIC_PROXY_STOP_ON_LIMIT === '1'
const proxy = PROXY_URL ? new Anthropic({ apiKey: 'proxy', baseURL: PROXY_URL, maxRetries: 0, timeout: 15 * 60 * 1000 }) : null
if (proxy) console.log(`LLM requests go through the proxy at ${PROXY_URL}`)

// Messages API params for one structured-output request. Used as is by the
// Batch API; the synchronous path adds server-side fallbacks (not allowed in
// batches) on top.
export const buildParams = ({ system, prompt, content, schema, effort = 'medium', maxTokens = 32000 }) => ({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    system,
    output_config: {
        effort,
        format: { type: 'json_schema', schema },
    },
    messages: [{ role: 'user', content: content ?? prompt }],
})

// Parses a structured-output message. Throws when the model refused or the
// answer was cut off, so callers never consume a partial result.
export const readJson = (message) => {
    if (message.stop_reason === 'refusal') {
        throw new Error(`Model refused: ${message.stop_details?.explanation ?? 'no details'}`)
    }
    if (message.stop_reason === 'max_tokens') {
        throw new Error('Response truncated at max_tokens')
    }
    const text = message.content.find(b => b.type === 'text')?.text
    if (!text) throw new Error('Response has no text block')
    return JSON.parse(text)
}

// Ends the whole run: callers that log an error and move on must rethrow it.
export class UsageLimitReached extends Error {}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Proxy answers are plain text: take the outermost JSON object and check that
// every required key is there, since the schema is not enforced.
const readProxyJson = (message, schema) => {
    if (message.stop_reason === 'max_tokens') throw new Error('Response truncated at max_tokens')
    const text = message.content.filter(b => b.type === 'text').map(b => b.text).join('')
    const start = text.indexOf('{'), end = text.lastIndexOf('}')
    if (start < 0 || end < start) throw new Error(`Proxy answer has no JSON: ${text.slice(0, 200)}`)
    const json = JSON.parse(text.slice(start, end + 1))
    const missing = (schema.required ?? []).filter(k => !(k in json))
    if (missing.length) throw new Error(`Proxy answer is missing ${missing.join(', ')}`)
    return json
}

const isUsageLimit = (err) => err?.status === 429 || err?.status === 529 ||
    /rate.?limit|usage.?limit|quota|overloaded|limit.*reset|limit reached|hit your limit/i.test(err?.message ?? '')
const isOverloaded = (err) => err?.status === 529 || /overloaded/i.test(err?.message ?? '')
const isConnection = (err) => err instanceof Anthropic.APIConnectionError || err?.status >= 500

// Seconds until a "resets 3:30am" time in the error message (local clock),
// or null when the message has none.
const secondsUntilReset = (message) => {
    const m = /resets\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i.exec(message ?? '')
    if (!m) return null
    const reset = new Date()
    reset.setHours((Number(m[1]) % 12) + (m[3].toLowerCase() === 'pm' ? 12 : 0), Number(m[2] ?? 0), 0, 0)
    if (reset <= new Date()) reset.setDate(reset.getDate() + 1)
    return (reset - new Date()) / 1000
}

// Seconds to wait: the retry-after header or the reset time in the message
// when there is one (plus a minute of margin), otherwise 1, 2, 4 ... minutes
// capped at 15.
const waitSeconds = (err, attempt) => {
    const header = Number(err?.headers?.get?.('retry-after') ?? err?.headers?.['retry-after'])
    if (header > 0) return header + 5
    const untilReset = secondsUntilReset(err?.message)
    if (untilReset !== null && untilReset < 24 * 3600) return untilReset + 60
    return Math.min(60 * 2 ** attempt, 15 * 60)
}

const askProxy = async ({ onUsage, ...request }) => {
    const params = buildParams(request)
    params.system = `${params.system}\n\nRespond with only a JSON object (no markdown, no prose) that matches this JSON schema:\n${JSON.stringify(request.schema)}`
    let limitWaits = 0, connectionErrors = 0, badAnswers = 0
    while (true) {
        try {
            const message = await proxy.messages.stream(params).finalMessage()
            onUsage?.(message.usage, message.model)
            return readProxyJson(message, request.schema)
        } catch (err) {
            if (STOP_ON_LIMIT && isUsageLimit(err) && !isOverloaded(err)) {
                throw new UsageLimitReached(`Usage limit reached, stopping the run: ${err.message.slice(0, 200)}`)
            } else if (isUsageLimit(err)) {
                const seconds = waitSeconds(err, limitWaits++)
                console.log(`  Usage limit reached (${err.message.slice(0, 120)}); waiting ${Math.round(seconds / 60)} min`)
                await sleep(seconds * 1000)
            } else if (isConnection(err) && connectionErrors < 10) {
                const seconds = Math.min(30 * 2 ** connectionErrors++, 10 * 60)
                console.log(`  Proxy unreachable (${err.message.slice(0, 120)}); retrying in ${seconds}s`)
                await sleep(seconds * 1000)
            } else if (!err.status && badAnswers < 2 && !(err instanceof Anthropic.APIError)) {
                badAnswers++
                console.log(`  Unusable proxy answer (${err.message.slice(0, 120)}); asking again`)
            } else {
                throw err
            }
        }
    }
}

// One synchronous structured-output call. `onUsage` receives the token usage.
export const askJson = async ({ onUsage, ...request }) => {
    if (proxy) return askProxy({ onUsage, ...request })
    const stream = anthropic.beta.messages.stream({
        ...buildParams(request),
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
    })
    const message = await stream.finalMessage()
    onUsage?.(message.usage, message.model)
    return readJson(message)
}

export const usageCost = (usage, { batch = false } = {}) => {
    const input = (usage.input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0)
    const output = usage.output_tokens ?? 0
    const cost = (input * PRICE_INPUT + output * PRICE_OUTPUT) / 1e6
    return { input, output, cost: batch ? cost / 2 : cost }
}
