import 'dotenv/config'
import Knex from 'knex'
import { institutions } from '../shared/institutions.js'
import { FileManagerClient } from '../shared/fileManagerClient.js'

const knex = Knex({
    client: 'pg',
    connection: `postgresql://${process.env.POSTGRES_DB_USER ?? 'myuser'}:${process.env.POSTGRES_DB_PASSWORD ?? 'mypassword'}@${process.env.POSTGRES_HOST ?? 'localhost'}:5432/${process.env.POSTGRES_DB ?? 'informacion-dominicana'}`
})

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
    const { institutionName } = institution
    console.log(`\nExporting: ${institutionName}`)
    await exportInstitution(institutionName)
}

console.log('\nExport complete.')
await knex.destroy()

async function save(institutionName, fileName, data) {
    const key = `${institutionName}/nomina/exportToJson/${fileName}`
    await fileManagerClient.createTextFile(key, JSON.stringify(data))
    console.log(`  Saved: ${key}`)
}

async function exportInstitution(institutionName) {
    const payroll = await knex('payrolls')
        .select(knex.raw(`TO_CHAR("date", 'YYYY-MM-DD') AS time`))
        .select(knex.raw('SUM(income)::FLOAT AS value'))
        .where('institutionName', institutionName)
        .groupBy('time')
        .orderBy('time', 'asc')

    const employeersTotal = await knex('payrolls')
        .select(knex.raw(`TO_CHAR("date", 'YYYY-MM-DD') AS time`))
        .select(knex.raw('COUNT(income)::FLOAT AS value'))
        .where('institutionName', institutionName)
        .groupBy('time')
        .orderBy('time', 'asc')

    const employeersM = await knex('payrolls')
        .select(knex.raw(`TO_CHAR("date", 'YYYY-MM-DD') AS time`))
        .select(knex.raw('COUNT(income)::FLOAT AS value'))
        .where('sex', 'M')
        .where('institutionName', institutionName)
        .groupBy('time')
        .orderBy('time', 'asc')

    const employeersF = await knex('payrolls')
        .select(knex.raw(`TO_CHAR("date", 'YYYY-MM-DD') AS time`))
        .select(knex.raw('COUNT(income)::FLOAT AS value'))
        .where('sex', 'F')
        .where('institutionName', institutionName)
        .groupBy('time')
        .orderBy('time', 'asc')

    const positionRows = await knex('payrolls')
        .select(knex.raw(`TO_CHAR("date", 'YYYY-MM') AS date_key`), '*')
        .where('institutionName', institutionName)
        .orderBy('income', 'asc')

    const employeersByPosition = {}
    positionRows.forEach(row => {
        const dateKey = row.date_key
        employeersByPosition[dateKey] ??= {}
        employeersByPosition[dateKey][row.position] ??= []
        delete row.date_key
        employeersByPosition[dateKey][row.position].push(row)
    })

    const percentageRows = await knex('payrolls').select(
        knex.raw(`TO_CHAR("date", 'YYYY-MM') AS date_key`),
        'position',
        knex.raw('COUNT(*) AS "employeeCount"'),
        knex.raw(`ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (PARTITION BY TO_CHAR("date", 'YYYY-MM')), 0), 6) AS "employeeCountPercentage"`),
        knex.raw('ROUND(AVG(income)::numeric, 2) AS "averageSalary"'),
        knex.raw(`ROUND(AVG(income) * 100.0 / NULLIF(SUM(AVG(income)) OVER (PARTITION BY TO_CHAR("date", 'YYYY-MM')), 0), 6) AS "averageSalaryPercentage"`)
    )
        .where('institutionName', institutionName)
        .groupBy('date_key', 'position')
        .orderBy('date_key', 'asc')
        .orderBy('employeeCount', 'desc')

    const percentageOfSpendingByPosition = {}
    percentageRows.forEach(row => {
        const dateKey = row.date_key
        percentageOfSpendingByPosition[dateKey] ??= {}
        percentageOfSpendingByPosition[dateKey][row.position] = {
            employeeCount: Number(row.employeeCount),
            employeeCountPercentage: Number(row.employeeCountPercentage),
            averageSalary: Number(row.averageSalary),
            averageSalaryPercentage: Number(row.averageSalaryPercentage),
        }
    })

    const header = []
    await save(institutionName, 'payroll.json', payroll)
    await save(institutionName, 'employeersM.json', employeersM)
    await save(institutionName, 'employeersF.json', employeersF)
    await save(institutionName, 'employeersTotal.json', employeersTotal)
    for (const key of Object.keys(employeersByPosition)) {
        await save(institutionName, `employeersByPosition${key}.json`, employeersByPosition[key])
        header.push(key)
    }
    for (const key of Object.keys(percentageOfSpendingByPosition)) {
        await save(institutionName, `percentageOfSpendingByPosition${key}.json`, percentageOfSpendingByPosition[key])
    }
    await save(institutionName, 'header.json', header)
}
