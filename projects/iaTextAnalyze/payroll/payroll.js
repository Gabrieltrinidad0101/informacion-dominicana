import { propt } from "./propt";

export class Payroll {
    constructor(eventBus, api, fileManager) {
        this.eventBus = eventBus;
        this.fileManager = fileManager;
        this.api = api;

        this.eventBus.on('analyzeExtractedText', this.payroll)
    }

    payroll = async (data) => {
        const data = await this.fileManager.getFile(data.fileAccess);
        const text = data.map(d => d.text).join('\n');
        const propt = propt(text);
        const response = await this.api(propt);
        const fileAccess = this.fileManager.saveFile(data.instituction, data.typeOfData, 'iaTextAnalyze', data.year, data.month, `${data.index}.txt`, JSON.stringify(response));
        this.eventBus.emit('iaTextAnalyze', { ...data, fileAccess });
    }
}