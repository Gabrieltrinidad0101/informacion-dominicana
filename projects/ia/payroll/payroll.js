import { propt } from "./propt";

export class Payroll {
    constructor(eventBus,api, fileManager) {
        this.eventBus = eventBus;
        this.fileManager = fileManager;
        this.api = api;
    }

    payroll = async ({ fileAccess, index, month, year, instituction }) => {
        const text = await this.fileManager.getFilePayroll(fileAccess);
        const propt = propt(text);
        const response = await this.api(propt);
        const fileAccess = this.fileManager.saveFilePayroll(instituction, 'ai_payroll', year, month, `${index}.txt`, JSON.stringify(response));
        this.eventBus.emit('ai_payroll', { fileAccess,index, month, year, instituction });
    }
}