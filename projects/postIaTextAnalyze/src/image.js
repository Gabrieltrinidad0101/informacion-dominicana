class Image {
    constructor(eventBus, fileManager) {
        this.eventBus = eventBus
        this.fileManager = fileManager
        this.eventBus.on('iaTextAnalyze', this.image)
    }

    image = async (data) => {
        const isPayroll = data.typeOfData === 'payroll'
        const iaTextAnalyze = this.fileManager.makePath(data.instituctionName, data.typeOfData, 'iaTextAnalyze', data.year, data.month, `${data.index}.json`)
        const analyzeExtractedText = this.fileManager.makePath(data.instituctionName, data.typeOfData, 'analyzeExtractedText', data.year, data.month, `${data.index}.json`)
        const iaTextAnalyzeFile = await this.fileManager.getFile(iaTextAnalyze)
        const analyzeExtractedTextFile = this.fileManager.getFile(analyzeExtractedText)
        this.mergeData(iaTextAnalyzeFile, analyzeExtractedTextFile, isPayroll)
    }

    mergeData = (iaTextAnalyzeFile, analyzeExtractedTextFile) => {
        iaTextAnalyzeFile.forEach(dataIa => {
            const lines = analyzeExtractedTextFile.filter(data => {
                if (!employee.document) {
                    return data.text.includes(employee.name)
                }
                return data.text.includes(employee.document)
            })
            if (lines.length > 1 || lines.length <= 0) {
                return
            }
            dataIa.x = lines[0].x
            dataIa.y = lines[0].y
            dataIa.width = lines[0].width
            dataIa.height = lines[0].height
            dataIa.pageAngle = analyzeExtractedTextFile.angle
            if (isPayroll && dataIa.document) dataIa.document = encrypt(dataIa.document)
        })
    }


}