import { getTextFromImageApiAzure } from "./apis/azure/azure.js";
import { getTextFromImageApiOcrSpace } from "./apis/ocrSpace/ocrSpace.js";



export class ImageToText {
    constructor(eventBus,fileManager) {
        this.eventBus = eventBus
        this.fileManager = fileManager
        this.eventBus.on('extractedText','extractedTexts', async (data,metadata)=> await this.getTextFromImage(data,metadata))
    }

    getTextFromImage = async (data,metadata) => {
        const isAzure = false // todo: remove azure logic
        let textOverlay = ""

        const extractedTextUrl = this.fileManager.generateUrl(data,'extractedText',`${data.index}.json`)
        if(metadata?.force || !await this.fileManager.fileExists(extractedTextUrl)){
            const bufferImage = await this.fileManager.getFileBuffer(data.imageUrl)
            if (isAzure) textOverlay = await getTextFromImageApiAzure({
                bufferImage
            })

            if (!isAzure) textOverlay = await getTextFromImageApiOcrSpace({
                bufferImage
            })
            await this.fileManager.createTextFile(extractedTextUrl, JSON.stringify(textOverlay))
        }
        
        this.eventBus.emit('analyzeExtractedTexts',{
            ...data,
            extractedTextUrl: extractedTextUrl,
            type: isAzure ? 'azure' : 'ocrSpace',
        },metadata);
    }
}


