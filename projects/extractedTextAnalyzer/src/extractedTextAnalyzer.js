import { groupLinesOcrSpace } from "./groupLineOcr.js";
import { groupLinesAzure } from "./groupLinesAzure.js";
import { paddleOCR } from "./paddleocr.js";
import { text } from "./text.js";

export class extractedTextAnalyzer {
    constructor(eventBus, fileManagerClient) {
        this.eventBus = eventBus;
        this.fileManagerClient = fileManagerClient;
        this.eventBus.on('extractedTextAnalyzer', 'extractedTextAnalyzers', (data, metadata) => this.extractedTextAnalyzer(data, metadata))
    }

    extractedTextAnalyzer = async (data, metadata) => {
        const fileName = data.index ? `${data.index}.json` : `page_${data.page}_img_${data.imageIndex}.json`;
        const fileUrl = this.fileManagerClient.generateUrl(data, 'extractedTextAnalyzer', fileName)
        let textFormatted;
        let angle = 0;
        if (metadata.force || !await this.fileManagerClient.fileExists(fileUrl)) {
            const rawData = JSON.parse((await this.fileManagerClient.getFile(data.extractedTextUrl)).toString('utf-8'));
            if (data.extractedTextType === 'Text') {
                textFormatted = text(rawData.lines);
            }
            if (data.extractedTextType === 'PaddleOCR') {
                const { regions } = paddleOCR(rawData);
                angle = rawData['doc_preprocessor_result']['angle'];
                textFormatted = regions;
            }
            if (data.extractedTextType === 'azure') {
                textFormatted = groupLinesAzure(rawData);
            }
            if (data.extractedTextType === 'ocrSpace') {
                textFormatted = groupLinesOcrSpace(rawData);
                angle = rawData['OCRExitCode'];
            }
            await this.fileManagerClient.createTextFile(fileUrl, JSON.stringify({ lines: textFormatted, angle }));
        }
        await this.eventBus.emit('aiTextAnalyzers', { ...data, extractedTextAnalyzerUrl: fileUrl }, metadata);
    }
}