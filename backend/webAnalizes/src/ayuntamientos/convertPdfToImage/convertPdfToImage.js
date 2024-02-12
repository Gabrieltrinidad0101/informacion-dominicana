const path = require("path");
const { fromPath } = require("pdf2pic");
const sharp = require('sharp');
const fs = require("fs").promises

const options = {
  density: 700,
  saveFilename: "ayuntamientojarabacoa",
  savePath: __dirname + "/imageTemp",
  format: "jpg",
  width: 2000,
  height: 2000
};

// Define the crop coordinates and dimensions
const cropOptions = {
  left: 200,
  top: 500,
  width: 1700,
  height: 1150
};

const convertPdfToImage = async ()=>{
  const pdfs = path.join(__dirname,"../downloadPdf/pdf")
  const townHalls = await fs.readdir(pdfs)

  for(const townHall of townHalls){
    const nominas = await fs.readdir(path.join(pdfs,townHall))
    for(const nomina of nominas){
      const pdfNomina = path.join(pdfs,townHall,nomina)
      const convert = fromPath(pdfNomina, options);
      await convert.bulk(-1)

      const folderImagesTemp = path.join(__dirname,"./imagesTemp",townHall)
      const folderImages = path.join(__dirname,"./images",townHall)
      fs.mkdir(folderImagesTemp)
      fs.mkdir(folderImages)
      const files = await fs.readdir(folderImagesTemp)  
      console.log("Getting image from pdf")
      for(const file of files){
        await cutImage(file,path.join(folderImagesTemp,file),folderImages)
      }
    }
  }

}


const cutImage = (file,fileFullpath,folderImages)=> new Promise((res,rej)=>{
  const fileName = path.join(folderImages,file)
  sharp(fileFullpath)
    .extract(cropOptions)
    .toFile(fileName, (err, info) => {
      if (err) {
        rej(err)
        console.error('Error occurred while cropping the image:', err);
        return;
      }
      res()
      console.log(`       image: ${fileName}`);
    });
})



module.exports = {convertPdfToImage}