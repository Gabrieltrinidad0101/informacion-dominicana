import axios from 'axios';
import FormData from 'form-data';
import { fileExists, forEachFolder, isNullEmptyUndefinerNan, monthsOrdes } from "../../utils.js";
import fs from 'fs';
import { constants } from '../../constants.js';
import path from 'path';


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
    const parsedText = result.ParsedResults[0].ParsedText;
    return parsedText;
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
                const filePath = path.join(folder, `${month}.txt`)
                if (fileExists(filePath)) continue
                const images = fs.readdirSync(nominaImages)
                let dataText = ""
                console.log(`converting image to text ${nominaImages}`)
                const imagesWithoutOrden = images.sort((a, b) => a.split(".")[1] - b.split(".")[1])
                for (const image of imagesWithoutOrden) {
                    if (path.extname(image) != ".jpg") continue
                    console.log(`   image to text: ${image}`)
                    const text = await getTextFromImageApi({
                        imagePath: path.join(nominaImages, image),
                        filename: image
                    })
                    dataText += `${text}\n------- Chunk -------\n`
                }
                fs.writeFileSync(filePath, dataText);
                await new Promise(res => setTimeout(res, 1000))
            }
        })
    })
}
