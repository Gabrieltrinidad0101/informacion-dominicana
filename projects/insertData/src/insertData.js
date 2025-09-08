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
        const file = await this.fileAccess.getFile(data.aiTextAnalyzeUrl)
        const payrolls = file.map(payroll => {
            payroll.institutionName = data.institutionName
            payroll.date = this.formatLastDayOfMonth(data.year, data.month)
            payroll.traceId = data.traceId
            payroll.index = data.index
            payroll.urlDownload = data.urlDownload
            if(payroll.position.includes('regidor')) payroll.position = 'Regidor'
            return payroll
        })
        await this.eventRepository.delete({...data,date: this.formatLastDayOfMonth(data.year, data.month)})
        await this.eventRepository.save(payrolls)
    }
}