import { groupLinesOcrSpace } from "./groupLineOcr";
import { groupLinesAzure } from "./groupLinesAzure";

export class AnalyzeExtractedText {
    constructor(eventBus, fileManager) {
        this.eventBus = eventBus;
        this.fileManager = fileManager;
    }

    analyzeExtractedText = async ({ type, index, month, year,fileAccess, instituction }) => {
        const rawData = await this.fileManager.getFile(fileAccess);
        let data;
        if (type === 'azure') {
            data  = groupLinesAzure(rawData);
        }
        if (type === 'ocrSpace') {
            data = groupLinesOcrSpace(rawData);
        }
        this.fileManager.saveFilePayroll(instituction, 'analyzeExtractedText', year, month, `${index}.json`, data);
        this.eventBus.emit('analyzeExtractedText', { index, month, year, instituction });
    }
}