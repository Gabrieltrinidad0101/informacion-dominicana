import { EventBus } from "../eventBus/eventBus.js"
import express from "express"
import cors from "cors"
import { EventListener } from "./src/listener.js"
import { EventsRepository } from "./src/repository.js"
import { ReExecuteEvents } from "./src/reExecuteEvents.js"

const app = express()
app.use(express.json())
app.use(cors())

const eventBus = new EventBus()
eventBus.bindQueue('readDownloadLink', 'downloadLinks')
eventBus.bindQueue('readGetPostDownloads', 'postDownloads')
eventBus.bindQueue('readExtractedText', 'extractedTexts')
eventBus.bindQueue('readDownload', 'downloads')


const eventsRepository = new EventsRepository()
const reExecuteEvents = new ReExecuteEvents(eventBus, eventsRepository)
new EventListener(eventBus, eventsRepository)

app.get('/find', async (req, res) => {
    const events = await reExecuteEvents.getEvents(req.query)
    res.json(events)
})

app.post('/reExecuteEvents', async (req, res) => {
    const events = await reExecuteEvents.reExecuteEvents(req.body)
    res.json(events)
})

app.listen(3000, () => {
    console.log('Server is running on port 3000')
})

