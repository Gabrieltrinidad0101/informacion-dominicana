import 'dotenv/config'
import Knex from 'knex'
import { institutions } from '../shared/institutions.js'
import { FileManagerClient } from '../shared/fileManagerClient.js'

const knex = Knex({
    client: 'pg',
    connection: `postgresql://${process.env.POSTGRES_DB_USER ?? 'myuser'}:${process.env.POSTGRES_DB_PASSWORD ?? 'mypassword'}@${process.env.POSTGRES_HOST ?? 'localhost'}:5432/${process.env.POSTGRES_DB ?? 'informacion-dominicana'}`
})

const monthMap = {
    enero: 1, febrero: 2, marzo: 3, abril: 4,
    mayo: 5, junio: 6, julio: 7, agosto: 8,
    septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12
}

await ensureTable()

const fileManagerClient = new FileManagerClient()

const institutionKey = process.argv[2]
const targetInstitutions = institutionKey
    ? [institutions[institutionKey]].filter(Boolean)
    : Object.values(institutions)

if (institutionKey && targetInstitutions.length === 0) {
    console.error(`Unknown institution: "${institutionKey}"`)
    process.exit(1)
}

for (const institution of targetInstitutions) {
    const prefix = `${institution.institutionName}/${institution.typeOfData}/aiProcess/`
    console.log(`\nScanning MinIO: ${prefix}`)

    const aiKeys = await fileManagerClient.listFiles(prefix)
    console.log(`Found ${aiKeys.length} AI result file(s)`)

    for (const aiKey of aiKeys) {
        const meta = fileManagerClient.parsePathMeta(aiKey)
        const monthNum = monthMap[meta.month]
        if (!monthNum) {
            console.log(`  Unknown month "${meta.month}", skipping: ${aiKey}`)
            continue
        }

        // Last day of the month
        const date = new Date(Number(meta.year), monthNum, 0)

        const buffer = await fileManagerClient.getFile(aiKey)
        const json = JSON.parse(buffer.toString('utf-8'))
        const rawLines = json?.lines ?? json

        const payrolls = rawLines
            .filter(p => p.name)
            .map(p => {
                let income = parseFloat(p.income) || 0
                let isHonorific = false
                if (p.income === 'Honorífico') {
                    isHonorific = true
                    income = 0
                }
                return {
                    date,
                    name: p.name ?? null,
                    document: p.document ?? null,
                    position: p.position?.includes('regidor') ? 'Regidor' : (p.position ?? null),
                    income,
                    isHonorific,
                    sex: p.sex?.slice(0, 1) ?? null,
                    accountBack: p.accountBack ?? null,
                    phoneNumber: p.phoneNumber ?? null,
                    institutionName: meta.institutionName,
                    urlDownload: aiKey.replace('/aiProcess/', '/download/').replace(/\.json$/, ''),
                    internalLink: aiKey
                }
            })

        if (payrolls.length === 0) {
            console.log(`  No payrolls in: ${aiKey}`)
            continue
        }

        await knex.transaction(async (trx) => {
            await trx('payrolls')
                .where({ date, institutionName: meta.institutionName, internalLink: aiKey })
                .del()
            await trx('payrolls').insert(payrolls)
        })

        console.log(`  Inserted ${payrolls.length} record(s) from: ${aiKey}`)
    }
}

console.log('\nInsert complete.')
await knex.destroy()

async function ensureTable() {
    const exists = await knex.schema.hasTable('payrolls')
    if (!exists) {
        await knex.schema.createTable('payrolls', (t) => {
            t.increments('id').primary()
            t.timestamp('date', { useTz: true })
            t.text('name')
            t.text('document')
            t.text('position')
            t.decimal('income', 15, 2)
            t.boolean('isHonorific')
            t.string('sex', 1)
            t.text('accountBack')
            t.text('phoneNumber')
            t.text('institutionName')
            t.text('urlDownload')
            t.text('internalLink')
        })
        console.log('Created table: payrolls')
    } else {
        const has_id = await knex.schema.hasColumn('payrolls', '_id')
        if (has_id) {
            await knex.raw('ALTER TABLE payrolls ALTER COLUMN "_id" SET DEFAULT gen_random_uuid()')
            console.log('Set default gen_random_uuid() on _id column')
        }
    }
}
