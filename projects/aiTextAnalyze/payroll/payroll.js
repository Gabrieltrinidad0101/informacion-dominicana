import { propt } from "./propt.js";

export class Payroll {
    constructor(eventBus, api, fileManager) {
        this.eventBus = eventBus;
        this.fileManager = fileManager;
        this.api = api;

        this.eventBus.on('textAnalysisAI','textAnalysisAIs', this.payroll)
    }

    payroll = async (data) => {
        const dataText = await this.fileManager.getFile(data.fileAccess);
        const propt_ = propt(JSON.stringify(dataText.lines));
        const response = await this.api(propt_);
        const fileAccess = this.fileManager.getPath(data.instituctionName, data.typeOfData, 'textAnalysisAI', data.year, data.month, `${data.index}.txt`)
        if(!this.fileManager.fileExists(fileAccess)) {
            this.fileManager.saveFile(data.instituctionName, data.typeOfData, 'textAnalysisAI', data.year, data.month, `${data.index}.txt`, JSON.stringify(response));
        }
        this.eventBus.emit('insertData', { ...data, fileAccess });
    }
}