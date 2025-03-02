import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const url = process.env.API_IMAGE_TO_TEXT;
const formData = new FormData();
formData.append('apikey', process.env.API_KEY);
formData.append('language', 'auto');
formData.append('isOverlayRequired', 'true');
formData.append('filetype', 'jpg');
formData.append('OCREngine', '2');

const getTextFromImageApi = async ({ imagePath, filename }) => {
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
    } else {
        const parsedText = result.ParsedResults[0].TextOverlay;
        console.log('Parsed Text:', parsedText);
    }
}

export const getTextFromImage = async () => {
    await forEachFolder(constants.townHalls(), async (townHall) => {
        if (!isNullEmptyUndefinerNan(path.extname(townHall))) return
        const yearsPath = constants.images(townHall)
        await forEachFolder(yearsPath, async (year) => {
            const monthsPath = path.join(yearsPath, year)
            const months = monthsOrdes(fs.readdir(monthsPath))
            for (const month of months) {
                const nominaImages = path.join(monthsPath, month)
                const folder = constants.preData(townHall, year)
                const filePath = path.join(folder, `${month}.txt`)
                if (fileExists(filePath)) continue
                const images = fs.readdir(nominaImages)
                let dataText = ""
                console.log(`converting image to text ${nominaImages}`)
                const imagesWithoutOrden = images.sort((a, b) => a.split(".")[1] - b.split(".")[1])
                for (const image of imagesWithoutOrden) {
                    if (path.extname(image) != ".jpg") continue
                    console.log(`   image to text: ${image}`)
                    const text = await getTextFromImageApi({
                        nominaImages,
                        filename: `${month}.jpg`
                    })
                    dataText += text.data.text
                }
                await new Promise(res => setTimeout(res, 500))
            }
        })
    })
}
