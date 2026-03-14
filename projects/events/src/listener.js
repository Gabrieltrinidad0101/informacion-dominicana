export class EventListener {
    constructor(eventBus, eventRepository) {
        this.eventBus = eventBus
        this.eventRepository = eventRepository
        this.eventBus.on('readDownloadLink', 'downloadLinks', this.saveBusinessEvent)
        this.eventBus.on('readGetPostDownloads', 'postDownloads', this.saveBusinessEvent)
        this.eventBus.on('readExtractedText', 'extractedTexts', this.saveBusinessEvent)
        this.eventBus.on('readDownload', 'downloads', this.saveBusinessEvent)
        this.eventBus.on('readextractedTextAnalyzer', 'extractedTextAnalyzers', this.saveBusinessEvent)
        this.eventBus.on('readAiTextAnalyzer', 'aiTextAnalyzers', this.saveBusinessEvent)
        this.eventBus.on('readInsertData', 'insertDatas', this.saveBusinessEvent)
        this.eventBus.on('readPayrollExportToJsons', 'payrollExportToJsons', this.saveBusinessEvent)
        this.eventBus.on('readWorldBank', 'worldBanks', this.saveBusinessEvent)
        this.eventBus.on('completed_event', 'completed_event', this.saveProgress, false)
    }

    saveBusinessEvent = async (event) => {
        event.startDate = new Date()
        delete event.progressDate
        delete event.completedDate
        await this.eventRepository.save(event)
    }

    saveProgress = async (event) => {
        console.log(event)
        await this.eventRepository.saveProgress(event)
    }
}
