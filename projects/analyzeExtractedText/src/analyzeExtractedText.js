import { groupLinesOcrSpace } from "./groupLineOcr.js";
import { groupLinesAzure } from "./groupLinesAzure.js";

export class AnalyzeExtractedText {
    constructor(eventBus, fileManagerClient) {
        this.eventBus = eventBus;
        this.fileManagerClient = fileManagerClient;
        this.eventBus.on('analyzeExtractedText', 'analyzeExtractedTexts', (data) => this.analyzeExtractedText(data))
    }

    analyzeExtractedText = async (data) => {
        const fileUrl = this.fileManagerClient.generateUrl(data, 'analyzeExtractedText', `${data.index}.json`)
        let textOfImage;
        if (!await this.fileManagerClient.fileExists(fileUrl)) {
            const rawData = await this.fileManagerClient.getFile(data.extractedTextUrl);
            if (data.type === 'azure') {
                textOfImage = groupLinesAzure(rawData);
            }
            if (data.type === 'ocrSpace') {
                textOfImage = groupLinesOcrSpace(rawData);
            }
            await this.fileManagerClient.createTextFile(fileUrl, JSON.stringify(textOfImage));
        }
        this.eventBus.emit('aiTextAnalyzers', { ...data, analyzeExtractedTextUrl: fileUrl });
    }
}