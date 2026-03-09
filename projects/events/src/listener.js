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
        if (event.exchangeName == 'downloads') {
            const exist = await this.eventRepository.findOne({
                institutionType: event.institutionType,
                typeOfData: event.typeOfData,
                link: event.link,
                year: event.year,
                month: event.month,
                institutionName: event.institutionName,
                exchangeName: event.exchangeName
            })
            if (exist) event = { ...event, "_id": exist._id }
        }

        if (event.exchangeName == 'extractedTexts') {
            const exist = await this.eventRepository.findOne({
                imageUrl: event.imageUrl,
                traceId: event.traceId,
                exchangeName: event.exchangeName
            })
            if (exist) event = { ...event, "_id": exist._id }
        }

        if (event.exchangeName == 'extractedTextAnalyzers') {
            const exist = await this.eventRepository.findOne({
                extractedTextUrl: event.extractedTextUrl,
                traceId: event.traceId,
                exchangeName: event.exchangeName
            })
            if (exist) event = { ...event, "_id": exist._id }
        }

        if (event.exchangeName == 'aiTextAnalyzers') {
            const exist = await this.eventRepository.findOne({
                extractedTextAnalyzerUrl: event.extractedTextAnalyzerUrl,
                traceId: event.traceId,
                exchangeName: event.exchangeName
            })
            if (exist) event = { ...event, "_id": exist._id }
        }

        event.startDate = new Date()
        delete event.progressDate
        delete event.completedDate
        await this.eventRepository.save(event)
    }

    saveProgress = async (event) => {
        await this.eventRepository.saveProgress(event)
    }
}