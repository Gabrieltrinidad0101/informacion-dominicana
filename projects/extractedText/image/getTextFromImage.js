import { getTextFromImageApiAzure } from "./apis/azure/azure.js";
import { getTextFromImageApiOcrSpace } from "./apis/ocrSpace/ocrSpace.js";

const useAzureApi = [
    { institutionName: "Jarabacoa", year: 2019, month: 'january' },
    { institutionName: "Jarabacoa", year: 2019, month: 9 },
    { institutionName: "Jarabacoa", year: 2018, month: 12 },
    { institutionName: "Jarabacoa", year: 2019, month: 'april' },
    { institutionName: "Jarabacoa", year: 2020, month: 'april' },
]

export class ImageToText {
    constructor(eventBus,fileManager) {
        this.eventBus = eventBus
        this.fileManager = fileManager
        this.eventBus.on('extractedText','extractedTexts', (data)=> this.getTextFromImage(data))
    }

    getTextFromImage = async (data) => {
        const isAzure = useAzureApi.find(d => d.institutionName === data.institutionName && d.year == data.year && d.month == data.month)
        let textOverlay = ""
        
        const extractedTextUrl = this.fileManager.generateUrl(data,'extractedText',`${data.index}.json`)
        const bufferImage = await this.fileManager.getFileBuffer(data.imageUrl)
        if(!await this.fileManager.fileExists(extractedTextUrl)){
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
        });
    }
}


