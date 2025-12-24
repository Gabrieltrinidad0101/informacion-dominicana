import { groupLinesOcrSpace } from "./groupLineOcr.js";
import { groupLinesAzure } from "./groupLinesAzure.js";
import { paddleORC } from "./paddleocr.js";

export class extractedTextAnalyzer {
    constructor(eventBus, fileManagerClient) {
        this.eventBus = eventBus;
        this.fileManagerClient = fileManagerClient;
        this.eventBus.on('extractedTextAnalyzer', 'extractedTextAnalyzers', (data,metadata) => this.extractedTextAnalyzer(data,metadata))
    }

    extractedTextAnalyzer = async (data,metadata) => {
        const fileUrl = this.fileManagerClient.generateUrl(data, 'extractedTextAnalyzer', `${data.index}.json`)
        let textOfImage;
        if (metadata.force || !await this.fileManagerClient.fileExists(fileUrl)) {
            const rawData = JSON.parse((await this.fileManagerClient.getFile(data.extractedTextUrl)).toString('utf-8'));
            if (data.extractedTextType === 'PaddleOCR') {
                textOfImage = paddleORC(rawData);
            }
            if (data.extractedTextType === 'azure') {
                textOfImage = groupLinesAzure(rawData);
            }
            if (data.extractedTextType === 'ocrSpace') {
                textOfImage = groupLinesOcrSpace(rawData);
            }
            await this.fileManagerClient.createTextFile(fileUrl, JSON.stringify({lines: textOfImage}));
        }
        await this.eventBus.emit('aiTextAnalyzers', { ...data, extractedTextAnalyzerUrl: fileUrl },metadata);
    }
}