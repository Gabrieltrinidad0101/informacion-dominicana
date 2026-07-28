import 'dotenv/config'
import axios from 'axios'
import { createKnex } from '../shared/db.js'

const knex = createKnex()

const validateIdNumberApi = async (idNumber) => {
    try {
        const url = `${process.env.VALIDATE_ID_NUMBER_API}/${idNumber.replace(/\D+/g, '')}/validate`
        const response = await axios.get(url)
        return response.data?.['valid'] ? true : false
    } catch {
        return null
    }
}

// ── args ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const flagValue = (flag) => {
    const i = args.indexOf(flag)
    return i !== -1 && i + 1 < args.length ? args[i + 1] : null
}
const year = flagValue('--year')
const month = flagValue('--month')

if (year) console.log(`Filtering by year: ${year}`)
if (month) console.log(`Filtering by month: ${month}`)

// ── query ─────────────────────────────────────────────────────────────────────

const query = knex('payrolls')
    .whereNotNull('document')
    .where('document', '!=', '')

if (year) query.whereRaw(`EXTRACT(YEAR FROM date) = ?`, [year])
if (month) query.whereRaw(`EXTRACT(MONTH FROM date) = ?`, [month])

const records = await query.select('_id', 'document')
console.log(`Found ${records.length} record(s) to validate`)

// ── validate ──────────────────────────────────────────────────────────────────

let updated = 0
let failed = 0

for (const record of records) {
    const isValid = await validateIdNumberApi(record.document)
    await knex('payrolls').where('_id', record._id).update({ isDocumentValid: isValid })
    if (isValid === null) {
        console.error(`  API error for document: ${record.document} (id: ${record._id})`)
        failed++
    } else {
        console.log(`  id: ${record._id} | document: ${record.document} | valid: ${isValid}`)
        updated++
    }
}

console.log(`\nDone. Updated: ${updated}, API errors: ${failed}`)
await knex.destroy()
