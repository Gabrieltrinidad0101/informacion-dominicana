const Tesseract = require('tesseract.js');

// Replace 'path/to/your/image.png' with the actual path to your image file
const imagePath = '/home/gabriel/Desktop/Javascript/informacion-dominicana/webAnalizes/src/ayuntamientos/image4.png';

// Perform OCR on the image
Tesseract.recognize(
  imagePath,
  'eng', // Language code for English
  {
    logger: info => console.log(info), // Optional logger callback
  }
).then(({ data: { text } }) => {
  // Print the extracted text
  console.log(text);
}).catch(error => {
  console.error(error);
});
