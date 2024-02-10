const { fromPath } = require("pdf2pic");

const options = {
  density: 700,
  saveFilename: "ayuntamientojarabacoa",
  savePath: __dirname + "/images",
  format: "jpg",
  width: 1500,
  height: 1500
};

const convert = fromPath("/home/gabriel/Desktop/Javascript/informacion-dominicana/backend/webAnalizes/src/ayuntamientos/downloadPdf/pdf/ayuntamientojarabacoa/Nomina-de-Enero-2018.pdf", options);

const convertPdfToImage = async ()=>{
  return await convert.bulk(-1)
}

module.exports = {convertPdfToImage}