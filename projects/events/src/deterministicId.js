import crypto from 'crypto'

const deterministicId = (...parts) =>
    crypto.createHash('sha256').update(parts.join(':')).digest('hex').slice(0, 24)

export const DETERMINISTIC_KEYS = {
    downloads:              (e) => deterministicId(e.link, e.year, e.month, e.institutionName, e.typeOfData),
    extractedTexts:         (e) => deterministicId(e.imageUrl, e.traceId),
    extractedTextAnalyzers: (e) => deterministicId(e.extractedTextUrl, e.traceId),
    aiTextAnalyzers:        (e) => deterministicId(e.extractedTextAnalyzerUrl, e.traceId),
}
