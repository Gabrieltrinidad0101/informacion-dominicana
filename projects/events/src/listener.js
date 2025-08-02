export class EventListener {
    constructor(eventBus, eventRepository) {
        this.eventBus = eventBus
        this.eventRepository = eventRepository
        this.eventBus.on('readDownloadLink', 'downloadLinks', this.saveEvent)
        this.eventBus.on('readGetPostDownloads', 'postDownloads', this.saveEvent)
        this.eventBus.on('readExtractedText', 'extractedTexts', this.saveEvent)
        this.eventBus.on('readDownload', 'downloads', this.saveEvent)
        this.eventBus.on('readAnalyzeExtractedText', 'analyzeExtractedTexts', this.saveEvent)
        this.eventBus.on('readTextAnalysisAI', 'textAnalysisAIs', this.saveEvent)
        this.eventBus.on('readInsertData', 'insertDatas', this.saveEvent)
    }

    saveEvent = async (event) => {
        await this.eventRepository.save(event);
    }
}