
import axios from 'axios';
import FormData from 'form-data';

const url = process.env.API_IMAGE_TO_TEXT;
export const getTextFromImageApiOcrSpace = async ({ bufferImage }) => {
    const formData = new FormData();

    formData.append('apikey', process.env.API_KEY);
    formData.append('language', 'auto');
    formData.append('isOverlayRequired', 'true');
    formData.append('filetype', 'jpg');
    formData.append('OCREngine', '2');

    const fileBuffer = Buffer.from(bufferImage);

    formData.append('file', fileBuffer, {
        filename: 'index.jpg',
        contentType: 'image/jpg',
    });

    const response = await axios.post(url, formData, {
        headers: {
            ...formData.getHeaders(),
        },
    });

    const result = response.data;
    if (result.IsErroredOnProcessing) {
        console.error('Error:', result.ErrorMessage);
        return;
    }

    const textOverlay = result.ParsedResults[0].TextOverlay.Lines;
    await new Promise(res => setTimeout(res, 3_000));
    return textOverlay;
};