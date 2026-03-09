import { eventBus } from '../eventBus/eventBus.js'
import { FileManagerClient } from '../fileManagerClient/main.js'
import { analyzeJson } from './analyzeJson.js'
import { downloadWorldBank } from './downloadWorldBank.js'

const fileAccess = new FileManagerClient()

eventBus.on('worldBank', 'worldBanks', async () => {
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
})
