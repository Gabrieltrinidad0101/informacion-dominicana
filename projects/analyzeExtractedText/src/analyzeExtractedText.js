import { groupLinesOcrSpace } from "./groupLineOcr.js";
import { groupLinesAzure } from "./groupLinesAzure.js";

export class AnalyzeExtractedText {
    constructor(eventBus, fileManager) {
        this.eventBus = eventBus;
        this.fileManager = fileManager;
        this.eventBus.on('analyzeExtractedText', 'analyzeExtractedTexts', (data) => this.analyzeExtractedText(data))
    }

    analyzeExtractedText = async (data) => {
        const rawData = await this.fileManager.getFile(data.fileAccess);
        const fileAccess = this.fileManager.getPath(data.instituctionName, data.typeOfData, 'analyzeExtractedText', data.year, data.month, `${data.index}.json`)
        let textOfImage;
        if (!this.fileManager.fileExists(fileAccess)) {
            if (data.type === 'azure') {
                textOfImage = groupLinesAzure(rawData);
            }
            if (data.type === 'ocrSpace') {
                textOfImage = groupLinesOcrSpace(rawData);
            }
            this.fileManager.saveFile(data.instituctionName, data.typeOfData, 'analyzeExtractedText', data.year, data.month, `${data.index}.json`, JSON.stringify(textOfImage));
        } else {
            textOfImage = await this.fileManager.getFile(fileAccess);
        }
        this.eventBus.emit('textAnalysisAIs', { ...data, fileAccess });
    }
}