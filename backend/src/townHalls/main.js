import vision from '@google-cloud/vision';
const client = new vision.ImageAnnotatorClient();

async function detectText(imagePath) {
  const [result] = await client.textDetection(imagePath, {
    imageContext: {
      textDetectionParams: {
        enableTextDetectionConfidenceScore: true, 
        advancedOcrOptions: ['NO_TEXT_RECOGNITION'],
      },
      // Specify language hints if needed
      languageHints: ['en'],
    },
  });

  const fullTextAnnotation = result.fullTextAnnotation;
  console.log(`Full text: ${fullTextAnnotation.text}`);
}

detectText('/home/gabriel/Desktop/Javascript/informacion-dominicana/dataPreprocessing/townHalls/Jarabacoa/images/2018/october/jarabacoaTownHall.8.jpg');
