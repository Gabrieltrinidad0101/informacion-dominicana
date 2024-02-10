const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

const images = path.join(__dirname,"../convertPdfToImage/images") 

function getAllFilesInFolder(folderPath) {
  return new Promise((resolve, reject) => {
    fs.readdir(folderPath, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files.map(file => path.join(folderPath, file)));
      }
    });
  });
}

const getTextFromImage = async (images)=>{
  const files = await getAllFilesInFolder(images)
  let totalText = ""
  for(const file of files){
    const text = await Tesseract.recognize(file,'eng')
    totalText += `${text.data.text}\n`
  }
  console.log(totalText)
}


module.exports = {getTextFromImage}
