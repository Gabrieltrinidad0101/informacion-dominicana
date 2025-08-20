export class EventListener {
    constructor(eventBus, eventRepository) {
        this.eventBus = eventBus
        this.eventRepository = eventRepository
        this.eventBus.on('readDownloadLink', 'downloadLinks', this.saveEvent)
        this.eventBus.on('readGetPostDownloads', 'postDownloads', this.saveEvent)
        this.eventBus.on('readExtractedText', 'extractedTexts', this.saveEvent)
        this.eventBus.on('readDownload', 'downloads', this.saveEvent)
        this.eventBus.on('readAnalyzeExtractedText', 'analyzeExtractedTexts', this.saveEvent)
        this.eventBus.on('readAiTextAnalyzer', 'aiTextAnalyzers', this.saveEvent)
        this.eventBus.on('readInsertData', 'insertDatas', this.saveEvent)
        this.eventBus.on('readPayrollExportToJsons', 'payrollExportToJsons', this.saveEvent)
    }

    saveEvent = async (event) => {
        if(event.exchangeName == 'downloads') {
            const exist = await this.eventRepository.findOne({
                institutionType: event.institutionType,
                typeOfData: event.typeOfData,
                link: event.link,
                year: event.year,
                month: event.month,
                institutionName: event.institutionName,
                exchangeName: event.exchangeName
            })
            if(exist) return
        }

        if(event.exchangeName == 'extractedTexts') {
            const exist = await this.eventRepository.findOne({
                institutionType: event.institutionType,
                typeOfData: event.typeOfData,
                link: event.link,
                year: event.year,
                month: event.month,
                traceId: event.traceId,
                index: event.index,
                urlDownload: event.urlDownload,
                institutionName: event.institutionName,
                exchangeName: event.exchangeName
            })
            if(exist) return
        }

        await this.eventRepository.save(event);
    }
}