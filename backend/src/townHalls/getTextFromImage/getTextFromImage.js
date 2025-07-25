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
    { department: "Jarabacoa", year: 2019, month: 'april'  },
    { department: "Jarabacoa", year: 2020, month: 'april'  },
]

export const getTextFromImage = async () => {
    await forEachFolder(constants.townHalls(), async (townHall) => {
        if (!isNullEmptyUndefinerNan(path.extname(townHall))) return
        const yearsPath = constants.images(townHall)
        await forEachFolder(yearsPath, async (year) => {
            const monthsPath = path.join(yearsPath, year)
            const months = monthsOrdes(fs.readdirSync(monthsPath))
            for (const month of months) {
                const nominaImages = path.join(monthsPath, month)
                const folder = constants.preData(townHall, year)
                const filePath = path.join(folder, `${month}.json`)
                if (fileExists(filePath)) continue
                const images = fs.readdirSync(nominaImages)
                const isAzure = useAzureApi.find(d => d.department === townHall && d.year == year && d.month == month)
                console.log(`${isAzure ? 'azure' : 'ocrSpace'} converting image to text ${nominaImages}`)
                const imagesWithOrden = images.sort((a, b) => a.split(".")[1] - b.split(".")[1])
                let pages = {}
                for (let i = 0; i < imagesWithOrden.length; i++) {
                    const image = imagesWithOrden[i]
                    if (path.extname(image) != ".jpg") continue
                    console.log(`   image to text: ${image}`)
                    const fileTextOverlayPath = constants.preData(townHall, `${year}/${month}/${i}_textOverlay.json`)
                    const fileTextOverlay = fs.existsSync(fileTextOverlayPath)
                    let textOverlay = ""

                    if (isAzure && !fileTextOverlay) textOverlay = await getTextFromImageApiAzure({
                        imagePath: path.join(nominaImages, image),
                        filename: image
                    })

                    if (!isAzure && !fileTextOverlay) textOverlay = await getTextFromImageApiOcrSpace({
                        imagePath: path.join(nominaImages, image),
                        filename: image
                    })

                    if (fileTextOverlay) 
                        textOverlay = JSON.parse(fs.readFileSync(fileTextOverlayPath).toString())

                    if (!textOverlay) {
                        pages[i + 1] = []
                        continue
                    }

                    const data = isAzure ? groupLinesAzure(textOverlay) : groupLinesOcrSpace(textOverlay)
                    pages[i + 1] = data
                    fs.writeFileSync(filePath, JSON.stringify(pages));
                    if (!fileTextOverlay) fs.writeFileSync(fileTextOverlayPath, JSON.stringify(textOverlay));
                }
            }
        })
    })
}