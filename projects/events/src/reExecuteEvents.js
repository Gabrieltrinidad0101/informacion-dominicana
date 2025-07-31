export class ReExecuteEvents {
    constructor(eventBus, eventsRepository){
        this.eventsRepository = eventsRepository
        this.eventBus = eventBus
    }
    
    reExecuteEvents = async (data) => {
        const events = await this.getEvents(data)
        events.forEach(event => {
            event.retryCount = event.retryCount ?? 0
            event.retryCount++
            this.eventBus.emitCustomExchange(event.exchangeName,event)
        })
    }
    
    getEvents = async (data) => {
        const events = await this.eventsRepository.find(data)
        return events ?? {}
    }
}