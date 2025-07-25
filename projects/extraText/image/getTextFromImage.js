import { fileExists, forEachFolder, isNullEmptyUndefinerNan, monthsOrdes } from "../../utils.js";
import fs from 'fs';
import { constants } from '../../constants.js';
import path from 'path';
import { getTextFromImageApiAzure } from "./apis/azure/azure.js";
import { getTextFromImageApiOcrSpace } from "./apis/ocrSpace/ocrSpace.js";
import { groupLinesOcrSpace } from "./apis/ocrSpace/groupLine.js";
import { groupLinesAzure } from "./apis/azure/groupLines.js";

const useAzureApi = [
    { department: "Jarabacoa", year: 2019, month: 'january' },
    { department: "Jarabacoa", year: 2019, month: 9 },
    { department: "Jarabacoa", year: 2018, month: 12 },
    { department: "Jarabacoa", year: 2019, month: 'april' },
    { department: "Jarabacoa", year: 2020, month: 'april' },
]

export const getTextFromImage = async ({ fileAccess, month, year, department }) => {
    const isAzure = useAzureApi.find(d => d.department === townHall && d.year == year && d.month == month)
    console.log(`${isAzure ? 'azure' : 'ocrSpace'} converting image to text ${nominaImages}`)

    if (isAzure && !fileTextOverlay) textOverlay = await getTextFromImageApiAzure({
        imagePath: fileAccess,
        filename: department
    })

    if (!isAzure && !fileTextOverlay) textOverlay = await getTextFromImageApiOcrSpace({
        imagePath: fileAccess,
        filename: department
    })

    if (fileTextOverlay)
        textOverlay = JSON.parse(fs.readFileSync(fileTextOverlayPath).toString())

    if (!textOverlay) {
        pages[i + 1] = []
        return
    }

    const data = isAzure ? groupLinesAzure(textOverlay) : groupLinesOcrSpace(textOverlay)
    pages[i + 1] = data
    fs.writeFileSync(filePath, JSON.stringify(pages));
    if (!fileTextOverlay) fs.writeFileSync(fileTextOverlayPath, JSON.stringify(textOverlay));
}
