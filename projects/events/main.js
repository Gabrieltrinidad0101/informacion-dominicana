import { EventBus } from "../eventBus/eventBus.js"
import express from "express"
import cors from "cors"
import { EventListener } from "./src/listener.js"
import { EventsRepository } from "./src/repository.js"
import { ReExecuteEvents } from "./src/reExecuteEvents.js"
import path,{dirname} from "path"
import { fileURLToPath } from 'url';
import dotenv from "dotenv"

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({
    path: path.join(__dirname,".env")
})

const app = express()
app.use(express.json())
app.use(cors("*"))

const eventBus = new EventBus()

const eventsRepository = new EventsRepository()
eventsRepository.insertDefaultValues()
const reExecuteEvents = new ReExecuteEvents(eventBus, eventsRepository)
new EventListener(eventBus, eventsRepository)

app.get("/events", (req, res) => res.send("OK"));

app.get('/events/find', async (req, res) => {
    const events = await reExecuteEvents.getEvents(JSON.parse(JSON.stringify(req.query)))
    res.json(events)
})

app.post('/events/reExecuteEvents', async (req, res) => {
    const events = await reExecuteEvents.reExecuteEvents(req.body)
    res.json(events)
})

app.delete('/events/deleteEvents', async (req, res) => {
    const events = await eventsRepository.deleteEvents(req.body)
    res.json(events)
})

app.listen(3001, () => {
    console.log('Server is running on port 3001')
})
