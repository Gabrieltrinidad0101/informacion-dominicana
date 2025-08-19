export class InsertData {
    monthMap = {
        enero: 0,
        febrero: 1,
        marzo: 2,
        abril: 3,
        mayo: 4,
        junio: 5,
        julio: 6,
        agosto: 7,
        septiembre: 8,
        octubre: 9,
        noviembre: 10,
        diciembre: 11
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
        const file = await this.fileAccess.getFile(data.insertDataUrl)
        const payrolls = file.map(payroll => {
            payroll.institutionName = data.institutionName
            payroll.date = this.formatLastDayOfMonth(data.year, data.month)
            payroll.traceId = data.traceId
            return payroll
        })
        await this.eventRepository.save(payrolls)
    }
}