import 'dotenv/config'
import { FileManagerClient } from '../shared/fileManagerClient.js'
import { analyzeJson } from './analyzeJson.js'
import { downloadWorldBank } from './downloadWorldBank.js'

const fileAccess = new FileManagerClient()

const records = await downloadWorldBank()
const concepts = analyzeJson(records)

for (const concept of Object.keys(concepts).filter(c => c !== './')) {
    const entries = concepts[concept]
    const headers = []

    for (const [description, { indicatorId, data }] of entries) {
        await fileAccess.createTextFile(
            `worldBank/${concept}/${description}.json`,
            JSON.stringify(data)
        )
        headers.push({ title: description, indicatorId })
    }

    await fileAccess.createTextFile(
        `worldBank/${concept}/headers.json`,
        JSON.stringify(headers)
    )
}

console.log('worldBank done.')
