const path = require("path");
const { fromPath } = require("pdf2pic");
const sharp = require('sharp');
const { getMonth, fileExists } = require("../../utils");
const { constants } = require("../../constants");
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

const getPath = async (...paths)=>{
  try{
    const pathToReturn = path.join(...paths)
    if(pathToReturn === "") return pathToReturn
    await fs.mkdir(pathToReturn,{ recursive: true })
    return pathToReturn
  }catch(err){
    console.log(paths,"   ",err)
  }
}

const join = (...paths)=> path.join(...paths)

const convertPdfToImage = async ()=>{
  const townHallsPath = constants.townHalls()
  const townHalls = await fs.readdir(townHallsPath)
  for(const townHall of townHalls){
    if(path.extname(townHall) !== "") continue
    const townHallPdf = constants.downloadData(townHall)
    const years = await fs.readdir(townHallPdf)
    for(const year of years){
      const payrolls = await fs.readdir(await getPath(townHallPdf,year))
      for(const payroll of payrolls){
        const pdfNomina = join(townHallPdf,year,payroll)
        const month = getMonth(nomina)
        if(!month) {
          console.log(`Error getting month in ${pdfNomina}`)
          continue
        }
        const getDataFromDownload = await getPath(townHallsPath,townHall,`extraData/${year}/${month}/`)
        const files = await fs.readdir(downloadData)
        if(path.extname(files[0])) continue
        getImageFromPdf({
          townHallsPath,
          townHall,
          year,
          month,
          getDataFromDownload,
          files
        })
      }
      await new Promise(res=>setTimeout(res,2000))
    }
  }
}

const getImageFromPdf = async ({townHallsPath,townHall,year,month,getDataFromDownload,files})=>{
  const folderImagesTemp = await getPath(townHallsPath,townHall,`imagestemp/${year}/${month}/`)
  const imagesTemp = await fs.readdir(folderImagesTemp)
  
  if(files.length > 0) return
  if(imagesTemp.length <= 0) {
    const convert = fromPath(pdfNomina, options(folderImagesTemp));
    await convert.bulk(-1)
  }
  console.log(`Getting image from pdf ${getDataFromDownload}`)
  for(const image of imagesTemp){
    await cutImage(image,path.join(folderImagesTemp,image),getDataFromDownload)
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