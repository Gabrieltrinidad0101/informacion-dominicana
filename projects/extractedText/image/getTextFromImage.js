import { getTextFromImageApiAzure } from "./apis/azure/azure.js";
import { getTextFromImageApiOcrSpace } from "./apis/ocrSpace/ocrSpace.js";

const useAzureApi = [
    { instituctionName: "Jarabacoa", year: 2019, month: 'january' },
    { instituctionName: "Jarabacoa", year: 2019, month: 9 },
    { instituctionName: "Jarabacoa", year: 2018, month: 12 },
    { instituctionName: "Jarabacoa", year: 2019, month: 'april' },
    { instituctionName: "Jarabacoa", year: 2020, month: 'april' },
]

export class ImageToText {
    constructor(eventBus,fileManager) {
        this.eventBus = eventBus
        this.fileManager = fileManager
        this.eventBus.on('extractedText','extractedTexts', (data)=> this.getTextFromImage(data))
    }

    getTextFromImage = async (data) => {
        const isAzure = useAzureApi.find(d => d.instituctionName === data.instituctionName && d.year == data.year && d.month == data.month)
        const fileAccess = this.fileManager.getPath(data.instituctionName, data.typeOfData, 'analyzeExtractedText', data.year, data.month, `${data.index}.json`)
        let textOverlay = ""
        if(!this.fileManager.fileExists(fileAccess)){
            if (isAzure) textOverlay = await getTextFromImageApiAzure({
                imagePath: data.fileAccess,
                filename: data.instituctionName
            })
    
            if (!isAzure) textOverlay = await getTextFromImageApiOcrSpace({
                imagePath: data.fileAccess,
                filename: data.instituctionName
            })
            this.fileManager.saveFile(data.instituctionName,data.typeOfData,'analyzeExtractedText',data.year,data.month,`${data.index}.json`, JSON.stringify(textOverlay))
        }


        this.eventBus.emit('analyzeExtractedTexts',{
            ...data,
            fileAccess,
            type: isAzure ? 'azure' : 'ocrSpace',
        });
    }
}


