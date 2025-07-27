import { EventsRepository } from "./repository.js"
import { ReExecuteEvents } from "./reExecuteEvents.js"
import { EventBus } from "../eventBus/eventBus.js"
import express from "express"
import cors from "cors"

const app = express()
app.use(express.json())

const eventBus = new EventBus()
eventBus.bindQueue('downloadLink','downloadLink')
eventBus.bindQueue('getTextFromImage','getTextFromImage')
eventBus.bindQueue('extractedText','extractedText')
const eventsRepository = new EventsRepository()
const reExecuteEvents = new ReExecuteEvents(eventBus,eventsRepository)

app.get('/find',async (req,res)=>{
    const events = await eventsRepository.find(req.query)
    res.send(events)
})

app.post('/reExecuteEvents',async (req,res)=>{
    const events = await reExecuteEvents.reExecuteEvents(req.body)
    res.send(events)
})

app.listen(3000,()=>{
    console.log('Server is running on port 3000')
})  

