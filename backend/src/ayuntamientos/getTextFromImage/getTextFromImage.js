const Tesseract = require('tesseract.js');
const fs = require('fs').promises;
const path = require('path');
const { fileExists, monthsOrdes } = require('../../utils');

const getPath = (...paths)=>{
  const pathToReturn = path.join(...paths)
  if(pathToReturn === "") return pathToReturn
  fs.mkdir(pathToReturn,{ recursive: true }).catch((error)=>{console.log(error)})
  return pathToReturn
}

const getTextFromImage = async (analize)=>{
  const townHallsPath = path.join(__dirname,"../../../../processedData/townHalls")
  const townHalls = await fs.readdir(townHallsPath)

  for(const townHall of townHalls){
      const yearsPath = path.join(townHallsPath,townHall,"images")  
      const years = await fs.readdir(yearsPath)
      for(const year of years){
        const monthsPath = path.join(yearsPath,year)
        const months = monthsOrdes(await fs.readdir(monthsPath))
        for(const month of months){
          const nominaImages = path.join(monthsPath,month)
          const filePath = getPath(__dirname,`../preData/${year}/${month}/data.txt`)
          if(await fileExists(filePath)) {
            continue
          }
          const images = await fs.readdir(nominaImages)
          let dataText = ""
          console.log(`converting image to text ${nominaImages}`)
          for(const image of images){
            console.log(`   image to text: ${image}`)
            const text = await Tesseract.recognize(path.join(nominaImages,image),'eng',{
              errorHandler: (error) => console.log(error)
            })
            dataText += `${text.data.text}\n`
          }
          await fs.writeFile(filePath, dataText);
          await new Promise(res=>setTimeout(res,500))
        }
      }
  }
}


module.exports = {getTextFromImage}
