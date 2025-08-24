import { propt } from "./propt.js";

export class Payroll {
    constructor({eventBus, apiLLMClient, fileManagerClient,validateIdNumberApi, encrypt,getId}) {
        this.eventBus = eventBus;
        this.fileManagerClient = fileManagerClient;
        this.apiLLMClient = apiLLMClient;
        this.validateIdNumberApi = validateIdNumberApi;
        this.encrypt = encrypt;
        this.getId = getId;

        this.eventBus.on('aiTextAnalyzer','aiTextAnalyzers', async (data) => await this.payroll(data))
    }

    payroll = async (data) => {
        const aiTextAnalyzeUrl = this.fileManagerClient.generateUrl(data,'aiTextAnalyze', `${data.index}.json`)
        if(!await this.fileManagerClient.fileExists(aiTextAnalyzeUrl)) {
            const dataText = await this.fileManagerClient.getFile(data.analyzeExtractedTextUrl);
            const propt_ = propt(JSON.stringify(dataText.lines));
            const response = JSON.parse(await this.apiLLMClient(propt_));
            for (let payroll_ of response) {
                if(payroll_.document) payroll_.isDocumentValid = await this.validateIdNumberApi(payroll_.document)
                if(payroll_.document) payroll_.document = this.encrypt(payroll_.document)
                payroll_._id = this.getId()
            }
            await this.fileManagerClient.createTextFile(aiTextAnalyzeUrl,  JSON.stringify(response));
        }
        this.eventBus.emit("insertDatas",{
            ...data,
            aiTextAnalyzeUrl,
        })
    }
}