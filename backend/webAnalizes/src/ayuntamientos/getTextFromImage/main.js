const Tesseract = require('tesseract.js');

Tesseract.recognize(
    '/home/gabriel/Desktop/Javascript/informacion-dominicana/backend/webAnalizes/src/ayuntamientos/convertPdfToImage/images/prueba.1.jpg',
    'eng',
    { logger: m => console.log(m) }
  ).then(({ data: { text } }) => {
    console.log(text);
  })