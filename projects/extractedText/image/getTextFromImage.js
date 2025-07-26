import fs from 'fs';
import { getTextFromImageApiAzure } from "./apis/azure/azure.js";
import { getTextFromImageApiOcrSpace } from "./apis/ocrSpace/ocrSpace.js";
import { getFile } from "../../filesAccess/fileAccess.js";

const useAzureApi = [
    { department: "Jarabacoa", year: 2019, month: 'january' },
    { department: "Jarabacoa", year: 2019, month: 9 },
    { department: "Jarabacoa", year: 2018, month: 12 },
    { department: "Jarabacoa", year: 2019, month: 'april' },
    { department: "Jarabacoa", year: 2020, month: 'april' },
]

export class ImageToText {
    constructor(eventBus,fileManager) {
        this.eventBus = eventBus
        this.fileManager = fileManager
    }

    getTextFromImage = async ({ fileAccess, index, month, year, department }) => {
        const isAzure = useAzureApi.find(d => d.department === department && d.year == year && d.month == month)

        let textOverlay = ""
        if (isAzure) textOverlay = await getTextFromImageApiAzure({
            imagePath: fileAccess,
            filename: department
        })

        if (!isAzure) textOverlay = await getTextFromImageApiOcrSpace({
            imagePath: fileAccess,
            filename: department
        })

        const fileAccess = this.fileManager.makePath(department,'extractedText',year,month,`${index}.json`)
        this.fileManager.saveFilePayroll(fileAccess,textOverlay)

        this.eventBus.emit('extractedText',{
            index,
            month,
            fileAccess,
            year,
            type: isAzure ? 'azure' : 'ocrSpace',
            department,
        });
    }
}


