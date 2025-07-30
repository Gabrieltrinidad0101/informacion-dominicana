export class EventListener {
    constructor(eventBus, eventRepository) {
        this.eventBus = eventBus
        this.eventRepository = eventRepository
        this.eventBus.on('readDownloadLink', this.saveEvent)
        this.eventBus.on('readDownload', this.saveEvent)
        this.eventBus.on('readGetPostDownloads', this.saveEvent)
        this.eventBus.on('readExtractedText', this.saveEvent)
    }

    saveEvent = async (event) => {
        await this.eventRepository.save(event);
    }
}