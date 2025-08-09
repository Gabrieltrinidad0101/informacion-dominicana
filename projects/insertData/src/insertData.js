export class InsertData {
    constructor(eventBus, fileAccess, eventRepository) {
        this.eventBus = eventBus
        this.eventRepository = eventRepository
        this.fileAccess = fileAccess
        this.eventBus.on('insertData', 'insertDatas', this.saveEvent)
    }

    formatLastDayOfMonth(year, month) {
        return new Date(year, month, 0);
    }

    saveEvent = async (data) => {
        const file = this.fileAccess.getFile(data.fileAccess)
        const payrolls = file.map(payroll => {
            payroll.institutionName = data.institutionName
            payroll.date = this.formatLastDayOfMonth(data.year, data.month)
            payroll.downloadLink = data.link
            payroll.traceId = data.traceId
            return payroll
        })
        await this.eventRepository.save(payrolls)
    }
}