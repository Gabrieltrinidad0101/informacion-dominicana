const { fromPath } = require("pdf2pic");

const options = {
  density: 100,
  saveFilename: "prueba",
  savePath: __dirname + "/images",
  format: "jpg",
  width: 2000,
  height: 2000
};
const convert = fromPath("/home/gabriel/Desktop/Javascript/informacion-dominicana/backend/webAnalizes/src/ayuntamientos/downloadPdf/pdf/ayuntamientojarabacoa/nomina-noviembre-2018.pdf", options);
const pageToConvertAsImage = 1;

convert(pageToConvertAsImage, { responseType: "image" })
  .then((resolve) => {
    console.log("Page 1 is now converted as image");

    return resolve;
  });