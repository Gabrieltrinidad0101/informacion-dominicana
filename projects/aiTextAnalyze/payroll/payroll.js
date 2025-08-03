import { propt } from "./propt.js";

export class Payroll {
    constructor(eventBus, api, fileManager) {
        this.eventBus = eventBus;
        this.fileManager = fileManager;
        this.api = api;

        this.eventBus.on('textAnalysisAI','textAnalysisAIs', this.payroll)
    }

    payroll = async (data) => {
        const fileAccess = this.fileManager.getPath(data.institutionName, data.typeOfData, 'textAnalysisAI', data.year, data.month, `${data.index}.json`)
        if(!this.fileManager.fileExists(fileAccess)) {
            const dataText = await this.fileManager.getFile(data.fileAccess);
            const propt_ = propt(JSON.stringify(dataText.lines));
            const response = await this.api(propt_);
            for(const payroll of response) {
                payroll.isDocumentValid = await this.validateIdNumberApi.validateIdNumber(payroll.document)
                payroll.document = this.encrypt(payroll.document)
            }
            this.fileManager.saveFile(data.institutionName, data.typeOfData, 'textAnalysisAI', data.year, data.month, `${data.index}.json`, response);
        }


        this.eventBus.emit("insertDatas",{
            ...data,
            fileAccess,
        })
    }
}