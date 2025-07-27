export class EventListener {
    constructor(eventBus,eventRepository) {
        this.eventBus = eventBus
        this.eventRepository = eventRepository
        this.eventBus.on('downloadLink', this.saveEvent)
        this.eventBus.on('getTextFromImage', this.saveEvent)
        this.eventBus.on('extractedText', this.saveEvent)
    }

    saveEvent = async (event) => {
        await this.eventRepository.create(event)
    }
}