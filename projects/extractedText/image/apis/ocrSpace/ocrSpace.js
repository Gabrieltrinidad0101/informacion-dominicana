
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const url = process.env.API_IMAGE_TO_TEXT;
export const getTextFromImageApiOcrSpace = async ({ imagePath, filename }) => {
    const formData = new FormData();
    formData.append('apikey', process.env.API_KEY);
    formData.append('language', 'auto');
    formData.append('isOverlayRequired', 'true');
    formData.append('filetype', 'jpg');
    formData.append('OCREngine', '2');
    formData.append('file', fs.createReadStream(path.resolve(imagePath)), {
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
    await new Promise(res => setTimeout(res, 3_000))
    return textOverlay;
}
