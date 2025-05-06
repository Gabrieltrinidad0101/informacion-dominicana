
import axios from 'axios';
import { fileExists, forEachFolder, isNullEmptyUndefinerNan, monthsOrdes } from "../../utils.js";
import fs from 'fs';
import { constants } from '../../constants.js';
import path from 'path';
import { groupLines } from './groupLines.js';

const apiKey = process.env.API_KEY_IMAGE_TO_TEXT;
const apiUrl = process.env.API_URL_IMAGE_TO_TEXT;
const getTextFromImageApi = async ({ imagePath }) => {
    const imageData = fs.readFileSync(imagePath);
    const response = await axios.post(apiUrl, imageData, {
        headers: {
            'Ocp-Apim-Subscription-Key': apiKey,
            'Content-Type': 'image/jpeg',
        },
        responseType: 'json',
    });
    const operationLocation = response.headers['operation-location'];
    let result;
    for (let i = 0; i < 10; i++) {
        const resultResponse = await axios.get(operationLocation, {
            headers: {
                'Ocp-Apim-Subscription-Key': apiKey,
            },
        });
        if (resultResponse.data.status === 'succeeded') {
            result = resultResponse.data.analyzeResult;
            break;
        } else if (resultResponse.data.status === 'failed') {
            console.error(resultResponse)
            return
        }
    }
    if (!result) {
        console.error('Timed out waiting for result.')
        return
    }


    return result;
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
                    if(!fileTextOverlay) await new Promise(res => setTimeout(res, 30_000))
                    fs.writeFileSync(filePath, JSON.stringify(pages));
                    if (!fileTextOverlay) fs.writeFileSync(fileTextOverlayPath, JSON.stringify(textOverlay));
                }
            }
        })
    })
}
