export class InsertData {
    monthMap = {
        enero: 1,
        febrero: 2,
        marzo: 3,
        abril: 4,
        mayo: 5,
        junio: 6,
        julio: 7,
        agosto: 8,
        septiembre: 9,
        octubre: 10,
        noviembre: 11, 
        diciembre: 12
    };
    constructor(eventBus, fileAccess, eventRepository) {
        this.eventBus = eventBus
        this.eventRepository = eventRepository
        this.fileAccess = fileAccess
        this.eventBus.on('insertData', 'insertDatas', this.saveEvent)
    } 

    formatLastDayOfMonth(year, month) {
        return new Date(year,  this.monthMap[month], 0);
    }

    saveEvent = async (data) => {
        const file = JSON.parse((await this.fileAccess.getFile(data.aiTextAnalyzeUrl)).toString('utf-8'));
        const payrolls = (file?.lines ?? file).map(payroll => {
            payroll.institutionName = data.institutionName
            payroll.date = this.formatLastDayOfMonth(data.year, data.month)
            payroll.traceId = data.traceId
            payroll.index = data.index ?? data.page
            payroll.internalLink = this.fileAccess.generateUrl(data,'pii','document.pdf')
            payroll.urlDownload = data.urlDownload
            payroll.income ??= 0
            if (payroll.income === 'Honorífico') {
                payroll.isHonorific = true
                payroll.income = 0
            }
            payroll.isDocumentValid = payroll.isDocumentValid === 'None' ? null : payroll.isDocumentValid === 'Valid'
            payroll.document = payroll.document ?? null
            payroll.confidences = JSON.stringify(payroll.confidences)
            if(payroll.position?.includes('regidor')) payroll.position = 'Regidor'
            return payroll
        })
        if(payrolls.length <= 0) return
        await this.eventRepository.delete({...data,date: this.formatLastDayOfMonth(data.year, data.month)})
        await this.eventRepository.save(payrolls)
    }
}