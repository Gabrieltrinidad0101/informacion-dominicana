import { groupLinesOcrSpace } from "./groupLineOcr";
import { groupLinesAzure } from "./groupLinesAzure";

export class AnalyzeExtractedText {
    constructor(eventBus, fileManager) {
        this.eventBus = eventBus;
        this.fileManager = fileManager;
    }

    analyzeExtractedText = async (data) => {
        const rawData = await this.fileManager.getFile(data.fileAccess);
        let textOfImage;
        if (type === 'azure') {
            textOfImage  = groupLinesAzure(rawData);
        }
        if (type === 'ocrSpace') {
            textOfImage = groupLinesOcrSpace(rawData);
        }
        const fileAccess = this.fileManager.saveFile(data.instituctionName, data.typeOfData, 'analyzeExtractedText', data.year, data.month, `${data.index}.json`, textOfImage);
        this.eventBus.emit('analyzeExtractedText', { ...data, fileAccess });
    }
}