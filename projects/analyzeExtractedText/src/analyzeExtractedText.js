import { groupLinesOcrSpace } from "./groupLineOcr.js";
import { groupLinesAzure } from "./groupLinesAzure.js";

export class AnalyzeExtractedText {
    constructor(eventBus, fileManagerClient) {
        this.eventBus = eventBus;
        this.fileManagerClient = fileManagerClient;
        this.eventBus.on('analyzeExtractedText', 'analyzeExtractedTexts', (data,metadata) => this.analyzeExtractedText(data,metadata))
    }

    analyzeExtractedText = async (data,metadata) => {
        const fileUrl = this.fileManagerClient.generateUrl(data, 'analyzeExtractedText', `${data.index}.json`)
        let textOfImage;
        if (metadata.force || !await this.fileManagerClient.fileExists(fileUrl)) {
            console.log({"data": data})
            const rawData = await this.fileManagerClient.getFile(data.extractedTextUrl);
            if (data.type === 'azure') {
                textOfImage = groupLinesAzure(rawData);
            }
            if (data.type === 'ocrSpace') {
                textOfImage = groupLinesOcrSpace(rawData);
            }
            await this.fileManagerClient.createTextFile(fileUrl, JSON.stringify(textOfImage));
        }
        await this.eventBus.emit('aiTextAnalyzers', { ...data, analyzeExtractedTextUrl: fileUrl },metadata);
    }
}