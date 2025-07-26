class EventListener {
    constructor(eventBus,eventRepository) {
        this.eventBus = eventBu
        this.eventRepository = eventRepository
        this.eventBus.on('downloadLink', saveEvent)
        this.eventBus.on('getTextFromImage', saveEvent)
        this.eventBus.on('extractedText', saveEvent)
    }

    saveEvent = async (event) => {
        await this.eventRepository.saveEvent(event)
    }
}