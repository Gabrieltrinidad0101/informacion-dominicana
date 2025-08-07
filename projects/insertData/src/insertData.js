export class InsertData {
    constructor(eventBus,fileAccess, eventRepository) {
        this.eventBus = eventBus
        this.eventRepository = eventRepository
        this.fileAccess = fileAccess
        this.eventBus.on('insertData', 'insertDatas', this.saveEvent)
    }

    saveEvent = async (data) => {
        const file = this.fileAccess.getFile(data.fileAccess)
        const payrolls = file.map(payroll => {
            payroll.institutionName = data.institutionName
            payroll.year = data.year
            payroll.month = data.month
            payroll.downloadLink = data.link
            payroll.traceId = data.traceId
            return payroll
        })
        await this.eventRepository.save(payrolls)
    }
}