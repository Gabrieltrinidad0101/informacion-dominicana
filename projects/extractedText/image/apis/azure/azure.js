
import axios from 'axios';
import fs from 'fs';

const apiKey = process.env.API_KEY_IMAGE_TO_TEXT;
const apiUrl = process.env.API_URL_IMAGE_TO_TEXT;
export const getTextFromImageApiAzure = async ({ bufferImage }) => {
    const response = await axios.post(apiUrl, bufferImage, {
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
    await new Promise(res => setTimeout(res, 30_000))
    return result;
}


