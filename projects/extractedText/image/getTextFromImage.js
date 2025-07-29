import { getTextFromImageApiAzure } from "./apis/azure/azure.js";
import { getTextFromImageApiOcrSpace } from "./apis/ocrSpace/ocrSpace.js";

const useAzureApi = [
    { instituction: "Jarabacoa", year: 2019, month: 'january' },
    { instituction: "Jarabacoa", year: 2019, month: 9 },
    { instituction: "Jarabacoa", year: 2018, month: 12 },
    { instituction: "Jarabacoa", year: 2019, month: 'april' },
    { instituction: "Jarabacoa", year: 2020, month: 'april' },
]

export class ImageToText {
    constructor(eventBus,fileManager) {
        this.eventBus = eventBus
        this.fileManager = fileManager
    }

    getTextFromImage = async (data) => {
        const isAzure = useAzureApi.find(d => d.instituction === data.instituction && d.year == data.year && d.month == data.month)

        let textOverlay = ""
        if (isAzure) textOverlay = await getTextFromImageApiAzure({
            imagePath: data.fileAccess,
            filename: data.instituction
        })

        if (!isAzure) textOverlay = await getTextFromImageApiOcrSpace({
            imagePath: data.fileAccess,
            filename: data.instituction
        })

        const fileAccess = this.fileManager.saveFile(data.instituction,data.typeOfData,'extractedText',data.year,data.month,`${index}.json`, textOverlay)

        this.eventBus.emit('extractedText',{
            ...data,
            type: isAzure ? 'azure' : 'ocrSpace',
            fileAccess
        });
    }
}


