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

const eventsRepository = new EventsRepository()
eventsRepository.insertDefaultValues()
const reExecuteEvents = new ReExecuteEvents(eventBus, eventsRepository)
new EventListener(eventBus, eventsRepository)

app.get("/", (req, res) => res.send("OK"));

app.get('/find', async (req, res) => {
    const events = await reExecuteEvents.getEvents(JSON.parse(JSON.stringify(req.query)))
    res.json(events)
})

app.post('/reExecuteEvents', async (req, res) => {
    const events = await reExecuteEvents.reExecuteEvents(req.body)
    res.json(events)
})

app.delete('/deleteEvents', async (req, res) => {
    const events = await eventsRepository.deleteEvents(req.body)
    res.json(events)
})

app.listen(3001,'0.0.0.0', () => {
    console.log('Server is running on port 3001')
})
