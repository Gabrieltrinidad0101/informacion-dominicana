export class ReExecuteEvents {
    constructor(eventBus, eventsRepository){
        this.eventsRepository = eventsRepository
        this.eventBus = eventBus
    }
    
    reExecuteEvents = async (data) => {
        const events = await this.getEvents(data)
        events.forEach(event => {
            this.eventBus.emitCustomExchange(event.exChange,event)
        })
    }

    getEvents = async (data) => {
        const events = this.eventsRepository.find(data)
        return events
    }
}