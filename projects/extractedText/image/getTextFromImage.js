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
        const fileAccess = this.fileManager.getPath(data.institutionName, data.typeOfData, 'extractedText', data.year, data.month, `${data.index}.json`)
        let textOverlay = ""
        
        await new Promise(resolve => setTimeout(resolve, 5000))
        
        if(!this.fileManager.fileExists(fileAccess)){
            if (isAzure) textOverlay = await getTextFromImageApiAzure({
                imagePath: data.fileAccess,
                filename: data.institutionName
            })
    
            if (!isAzure) textOverlay = await getTextFromImageApiOcrSpace({
                imagePath: data.fileAccess,
                filename: data.institutionName
            })
            this.fileManager.saveFile(data.institutionName,data.typeOfData,'extractedText',data.year,data.month,`${data.index}.json`, JSON.stringify(textOverlay))
        }
        

        this.eventBus.emit('analyzeExtractedTexts',{
            ...data,
            fileAccess,
            type: isAzure ? 'azure' : 'ocrSpace',
        });
    }
}


