import { propt } from "./propt.js";

export class Payroll {
    constructor({eventBus, apiLLMClient, fileManagerClient,validateIdNumberApi, encrypt,getId}) {
        this.eventBus = eventBus;
        this.fileManagerClient = fileManagerClient;
        this.apiLLMClient = apiLLMClient;
        this.validateIdNumberApi = validateIdNumberApi;
        this.encrypt = encrypt;
        this.getId = getId;

        this.eventBus.on('aiTextAnalyzer','aiTextAnalyzers', async (data,metadata) => await this.payroll(data,metadata))
    }

    payroll = async (data,metadata) => {
        const aiTextAnalyzeUrl = this.fileManagerClient.generateUrl(data,'aiTextAnalyze', `${data.index}.json`)
        const fileExists = await this.fileManagerClient.fileExists(aiTextAnalyzeUrl);
        if (metadata?.force || !fileExists) {
            const dataText = await this.fileManagerClient.getFile(data.analyzeExtractedTextUrl);
            const propt_ = propt(JSON.stringify(dataText.lines));
            const response = JSON.parse(await this.apiLLMClient(propt_));
            for (let payroll_ of response) {
                if(payroll_.document) payroll_.isDocumentValid = await this.validateIdNumberApi(payroll_.document)
                payroll_._id = this.getId()
            }
            await this.fileManagerClient.createTextFile(aiTextAnalyzeUrl,  JSON.stringify({lines: response, angle: dataText.angle}));
        }
        this.eventBus.emit("insertDatas",{
            ...data,
            aiTextAnalyzeUrl,
        },metadata)
    }
}