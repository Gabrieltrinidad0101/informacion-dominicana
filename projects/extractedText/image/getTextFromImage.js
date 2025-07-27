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

    getTextFromImage = async ({ fileAccess, index, month, year, instituction }) => {
        const isAzure = useAzureApi.find(d => d.instituction === instituction && d.year == year && d.month == month)

        let textOverlay = ""
        if (isAzure) textOverlay = await getTextFromImageApiAzure({
            imagePath: fileAccess,
            filename: instituction
        })

        if (!isAzure) textOverlay = await getTextFromImageApiOcrSpace({
            imagePath: fileAccess,
            filename: instituction
        })

        const fileAccess = this.fileManager.makePath(instituction,'extractedText',year,month,`${index}.json`)
        this.fileManager.saveFilePayroll(fileAccess,textOverlay)

        this.eventBus.emit('extractedText',{
            index,
            month,
            fileAccess,
            year,
            type: isAzure ? 'azure' : 'ocrSpace',
            instituction,
        });
    }
}


