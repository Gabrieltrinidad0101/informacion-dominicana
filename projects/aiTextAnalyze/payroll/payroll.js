export class Payroll {
    constructor(eventBus, api, fileManager) {
        this.eventBus = eventBus;
        this.fileManager = fileManager;
        this.api = api;

        this.eventBus.on('iaTextAnalyze','iaTextAnalyzes', this.payroll)
    }

    payroll = async (data) => {
        const dataText = await this.fileManager.getFile(data.fileAccess);
        const text = dataText.lines.map(d => d.text).join('\n');
        const propt = propt(text);
        const response = await this.api(propt);
        const fileAccess = this.fileManager.getPath(data.instituctionName, data.typeOfData, 'iaTextAnalyze', data.year, data.month, `${data.index}.txt`)
        if(!this.fileManager.fileExists(fileAccess)) {
            this.fileManager.saveFile(data.instituctionName, data.typeOfData, 'iaTextAnalyze', data.year, data.month, `${data.index}.txt`, JSON.stringify(response));
        }
    }
}