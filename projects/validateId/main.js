import 'dotenv/config'
import Knex from 'knex'
import axios from 'axios'

const knex = Knex({
    client: 'pg',
    connection: `postgresql://${process.env.POSTGRES_DB_USER ?? 'myuser'}:${process.env.POSTGRES_DB_PASSWORD ?? 'mypassword'}@${process.env.POSTGRES_HOST ?? 'localhost'}:5432/${process.env.POSTGRES_DB ?? 'informacion-dominicana'}`
})

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
const year = args[args.indexOf('--year') + 1] ?? null
const month = args[args.indexOf('--month') + 1] ?? null

if (year) console.log(`Filtering by year: ${year}`)
if (month) console.log(`Filtering by month: ${month}`)

// ── query ─────────────────────────────────────────────────────────────────────

const query = knex('payrolls')
    .whereNotNull('document')
    .where('document', '!=', '')

if (year) query.whereRaw(`EXTRACT(YEAR FROM date) = ?`, [year])
if (month) query.whereRaw(`EXTRACT(MONTH FROM date) = ?`, [month])

const records = await query.select('id', 'document')
console.log(`Found ${records.length} record(s) to validate`)

// ── validate ──────────────────────────────────────────────────────────────────

let updated = 0
let failed = 0

for (const record of records) {
    const isValid = await validateIdNumberApi(record.document)
    await knex('payrolls').where('id', record.id).update({ isDocumentValid: isValid })
    if (isValid === null) {
        console.error(`  API error for document: ${record.document} (id: ${record.id})`)
        failed++
    } else {
        console.log(`  id: ${record.id} | document: ${record.document} | valid: ${isValid}`)
        updated++
    }
}

console.log(`\nDone. Updated: ${updated}, API errors: ${failed}`)
await knex.destroy()
