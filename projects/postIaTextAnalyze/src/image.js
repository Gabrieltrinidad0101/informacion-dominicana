class Image {
    constructor(eventBus, fileManager) {
        this.eventBus = eventBus
        this.fileManager = fileManager
        this.eventBus.on('iaTextAnalyze', this.image)
    }

    image = async (data) => {
        const isPayroll = data.typeOfData === 'payroll'
        const iaTextAnalyze = this.fileManager.makePath(data.institutionName, data.typeOfData, 'iaTextAnalyze', data.year, data.month, `${data.index}.json`)
        const analyzeExtractedText = this.fileManager.makePath(data.institutionName, data.typeOfData, 'analyzeExtractedText', data.year, data.month, `${data.index}.json`)
        const iaTextAnalyzeFile = await this.fileManager.getFile(iaTextAnalyze)
        const analyzeExtractedTextFile = this.fileManager.getFile(analyzeExtractedText)
        this.mergeData(iaTextAnalyzeFile, analyzeExtractedTextFile, isPayroll)
    }



}