export class EventListener {
    constructor(eventBus, eventRepository) {
        this.eventBus = eventBus
        this.eventRepository = eventRepository
        this.eventBus.on('readDownloadLink', this.saveEvent)
        this.eventBus.on('readGetTextFromImage', this.saveEvent)
        this.eventBus.on('readExtractedText', this.saveEvent)
        this.eventBus.on('readDownload', this.saveEvent)
    }

    saveEvent = async (event) => {
        await this.eventRepository.save(event);
    }
}