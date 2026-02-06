export class ReExecuteEvents {
    constructor(eventBus, eventsRepository){
        this.eventsRepository = eventsRepository
        this.eventBus = eventBus
    }
    
    reExecuteEvents = async (data) => {
        const search = data.event
        const events = await this.getEvents(search)
        events.forEach(async event => {
            event.retryCount = event.retryCount ?? 0
            event.retryCount++
            await this.eventBus.emitCustomExchange(search.exchangeName,event,{
                force: data.force,
                typeOfExecute: data.typeOfExecute,
            }) 
        }) 
    } 
    
    getEvents = async (data) => {
        const events = await this.eventsRepository.find({...data})
        await this.eventsRepository.updateEvent({...data})
        return events ?? {}
    }
}