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
  //await convert.bulk(-1)
  const folderImagesTemp = path.join(__dirname,"./imagesTemp")
  const files = await fs.readdir(folderImagesTemp)  
  console.log("Getting image from pdf")
  for(const file of files){
    await cutImage(file,path.join(folderImagesTemp,file))
  }
}


const cutImage = (file,fileFullpath)=> new Promise((res,rej)=>{
  const fileName = path.join(__dirname,"/images/",file)
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