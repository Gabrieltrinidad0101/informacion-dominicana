export class ReExecuteEvents {
    constructor(eventBus, eventsRepository) {
        this.eventsRepository = eventsRepository
        this.eventBus = eventBus
    }

    reExecuteEvents = async (data) => {
        const search = data.event
        const events = await this.getEvents(search)
        await this.eventsRepository.updateEvent({ ...search })
        for (const event of events) {
            console.log(event)
            await this.eventBus.emitCustomExchange(search.exchangeName, event, {
                force: data.force,
                typeOfExecute: data.typeOfExecute,
            })
        }
    }

    getEvents = async (data) => {
        const events = await this.eventsRepository.find({ ...data })
        return events ?? {}
    }
}