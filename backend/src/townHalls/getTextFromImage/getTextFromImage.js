
import axios from 'axios';
import FormData from 'form-data';
import { fileExists, forEachFolder, isNullEmptyUndefinerNan, monthsOrdes } from "../../utils.js";
import fs from 'fs';
import { constants } from '../../constants.js';
import path from 'path';
import { groupLines } from './groupLines.js';

const url = process.env.API_IMAGE_TO_TEXT;
const getTextFromImageApi = async ({ imagePath, filename }) => {
    const formData = new FormData();
    formData.append('apikey', process.env.API_KEY);
    formData.append('language', 'auto');
    formData.append('isOverlayRequired', 'true');
    formData.append('filetype', 'jpg');
    formData.append('OCREngine', '2');
    formData.append('file', fs.createReadStream(imagePath), {
        filename,
        contentType: 'image/jpg',
    });
    const response = await axios.post(url, formData, {
        headers: {
            ...formData.getHeaders(),
        },
    })

    const result = response.data;
    if (result.IsErroredOnProcessing) {
        console.error('Error:', result.ErrorMessage);
        return;
    }
    const textOverlay = result.ParsedResults[0].TextOverlay.Lines;
    return textOverlay;
}

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
                console.log(`converting image to text ${nominaImages}`)
                const imagesWithOrden = images.sort((a, b) => a.split(".")[1] - b.split(".")[1])
                let pages = {}
                for (let i = 0; i < imagesWithOrden.length; i++) {
                    const image = imagesWithOrden[i]
                    if (path.extname(image) != ".jpg") continue
                    console.log(`   image to text: ${image}`)
                    const fileTextOverlayPath = constants.preData(townHall, `${year}/${month}/${i}_textOverlay.json`)
                    const fileTextOverlay = fs.existsSync(fileTextOverlayPath)
                    const textOverlay = fileTextOverlay ? JSON.parse(fs.readFileSync(fileTextOverlayPath).toString()) : await getTextFromImageApi({
                        imagePath: path.join(nominaImages, image),
                        filename: image
                    })
                    if (!textOverlay) {
                        pages[i + 1] = []
                        continue
                    }
                    const data = groupLines(textOverlay)
                    pages[i + 1] = data
                    await new Promise(res => setTimeout(res, 1000))
                    fs.writeFileSync(filePath, JSON.stringify(pages));
                    if (!fileTextOverlay) fs.writeFileSync(fileTextOverlayPath, JSON.stringify(textOverlay));
                }
            }
        })
    })
}
