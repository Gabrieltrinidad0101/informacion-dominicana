import { getConcept } from './getConcept.js'

const sanitize = (name) =>
    name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9._-]/g, '_')

export const analyzeJson = (records) => {
    const dataByConcept = {
        Social: new Map(),
        Medioambiente: new Map(),
        Economia: new Map(),
        Educacion: new Map(),
        Salud: new Map(),
        Militar: new Map(),
        './': new Map()
    }

    for (const record of records) {
        if (record.value == null) continue
        const indicatorId = record.indicator.id
        const description = sanitize(record.indicator.value)
        const time = record.date
        const value = record.value

        const conceptName = getConcept(description)
        const concept = dataByConcept[conceptName]

        if (!concept.has(description)) concept.set(description, { indicatorId, data: [] })
        concept.get(description).data.push({ time: `${time}-01-01`, value: Number(value) })
    }

    for (const concept of Object.values(dataByConcept)) {
        for (const [, entry] of concept) {
            entry.data.sort((a, b) => a.time.localeCompare(b.time))
        }
    }

    return dataByConcept
}
