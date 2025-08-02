export class EventListener {
    constructor(eventBus,fileAccess, eventRepository) {
        this.eventBus = eventBus
        this.eventRepository = eventRepository
        this.fileAccess = fileAccess
        this.eventBus.on('insertData', 'insertDatas', this.saveEvent)
    }

    saveEvent = async (data) => {
        const file = this.fileAccess.getFile(data.fileAccess)
        const payrolls = file.map(payroll => {
            payroll.institution = data.instituctionName
            payroll.year = data.year
            payroll.month = data.month
            payroll.downloadLink = data.link
            return payroll
        })
        await this.eventRepository.save(payrolls)
    }
}