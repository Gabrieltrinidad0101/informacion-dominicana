const path = require("path");
const { fromPath } = require("pdf2pic");
const sharp = require('sharp');
const { getMonth, fileExists } = require("../../../utils");
const fs = require("fs").promises

const options = (savePath)=>({
  density: 700,
  saveFilename: "ayuntamientojarabacoa",
  savePath,
  format: "jpg",
  width: 2000,
  height: 2000
});

// Define the crop coordinates and dimensions
const cropOptions = {
  left: 200,
  top: 500,
  width: 1700,
  height: 1150
};

const getPath = (...paths)=>{
  const pathToReturn = path.join(...paths)
  if(pathToReturn === "") return pathToReturn
  fs.mkdir(pathToReturn,{ recursive: true }).catch((error)=>{console.log(error)})
  return pathToReturn
}

const join = (...paths)=> path.join(...paths)

const convertPdfToImage = async ()=>{
  const townHallsPath = getPath(__dirname,"../../../../processedData/townHalls")
  const townHalls = await fs.readdir(townHallsPath)
  for(const townHall of townHalls){
    const townHallPdf = getPath(townHallsPath,townHall,"pdf")
    const years = await fs.readdir(townHallPdf)
    for(const year of years){
      const nominas = await fs.readdir(getPath(townHallPdf,year))
      for(const nomina of nominas){
        const pdfNomina = join(townHallPdf,year,nomina)
        const month = getMonth(nomina)
        const folderImagesTemp = getPath(townHallsPath,townHall,`imagestemp/${year}/${month}`)
        const folderImages = getPath(townHallsPath,townHall,"images",year,month)
        const files = await fs.readdir(folderImagesTemp)  
        if(files.length <= 0) {
          const convert = fromPath(pdfNomina, options(folderImagesTemp));
          await convert.bulk(-1)
        }
        console.log(`Getting image from pdf ${folderImages}`)
        for(const file of files){
          await cutImage(file,path.join(folderImagesTemp,file),folderImages)
        }
      }
    }
  }
}


const cutImage = (file,fileFullpath,folderImages)=> new Promise(async (res,rej)=>{
  const fileName = path.join(folderImages,file)
  if(await fileExists(fileName)) return res()
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