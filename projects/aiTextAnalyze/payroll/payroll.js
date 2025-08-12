import { propt } from "./propt.js";

export class Payroll {
    constructor({eventBus, apiLLMClient, fileManager,validateIdNumberApi, encrypt,getId}) {
        this.eventBus = eventBus;
        this.fileManager = fileManager;
        this.apiLLMClient = apiLLMClient;
        this.validateIdNumberApi = validateIdNumberApi;
        this.encrypt = encrypt;
        this.getId = getId;

        this.eventBus.on('textAnalysisAI','textAnalysisAIs', (data) => this.payroll(data))
    }

    payroll = async (data) => {
        const fileAccess = this.fileManager.generatePath(data,'textAnalysisAI', `${data.index}.json`)
        if(!await this.fileManager.fileExists(fileAccess)) {
            const dataText = await this.fileManager.getFile(data.fileAccess);
            const propt_ = propt(JSON.stringify(dataText.lines));
            const response = JSON.parse(await this.apiLLMClient(propt_));
            for (let payroll_ of response) {
                if(payroll_.document) payroll_.isDocumentValid = await this.validateIdNumberApi(payroll_.document)
                if(payroll_.document) payroll_.document = this.encrypt(payroll_.document)
                payroll_._id = this.getId()
            }
            await this.fileManager.createTextFile(fileAccess,  JSON.stringify(response));
        }

        this.eventBus.emit("insertDatas",{
            ...data,
            fileAccess,
        })
    }
}