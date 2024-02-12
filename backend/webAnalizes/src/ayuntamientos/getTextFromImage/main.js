const Tesseract = require('tesseract.js');
const fs = require('fs').promises;
const path = require('path');
const { fileExists } = require('../../../utils');

const getTextFromImage = async (images)=>{
  const filePath = path.join(images,"data.txt")
  if(await fileExists(filePath)) {
    return await fs.readFile(filePath, 'utf8');
  }
  const files = await fs.readdir(images)
  let totalText = ""
  console.log(`converting image to text ${images}`)
  for(const file of files){
    console.log(`   image to text: ${file}`)
    const text = await Tesseract.recognize(path.join(images,file),'eng',{
      errorHandler: (error) => console.log(error)
    })
    totalText += `${text.data.text}\n`
  }

  fs.writeFile(filePath, totalText, (err) => {
    if (err) {
      console.error('Error occurred while writing to file:', err);
      return;
    }
    console.log('File created successfully.');
  });
  return totalText
}


module.exports = {getTextFromImage}
