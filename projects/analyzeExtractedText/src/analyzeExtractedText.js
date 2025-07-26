import { groupLinesOcrSpace } from "./groupLineOcr";
import { groupLinesAzure } from "./groupLinesAzure";

export class AnalyzeExtractedText {
    constructor(eventBus, fileManager) {
        this.eventBus = eventBus;
        this.fileManager = fileManager;
    }

    analyzeExtractedText = async ({ type, index, month, year, department }) => {
        const textOverlay = await this.fileManager.getFilePayroll(department, 'extractedText', year, month, `${index}.json`);
        const rawData = JSON.parse(textOverlay);
        let data;
        if (type === 'azure') {
            data  = groupLinesAzure(rawData);
        }
        if (type === 'ocrSpace') {
            data = groupLinesOcrSpace(rawData);
        }
        this.fileManager.saveFilePayroll(department, 'analyzeExtractedText', year, month, `${index}.json`, data);
        this.eventBus.emit('analyzeExtractedText', { index, month, year, department });
    }
}