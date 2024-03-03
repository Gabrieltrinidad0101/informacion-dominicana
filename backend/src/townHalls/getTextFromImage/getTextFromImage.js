const Tesseract = require('tesseract.js');
const fs = require('fs').promises;
const path = require('path');
const { fileExists, monthsOrdes } = require('../../utils');
const { constants } = require('../constants');

const getTextFromImage = async (analize)=>{ 
  const townHallsPath = constants.townHalls()
  const townHalls = await fs.readdir(townHallsPath)
  for(const townHall of townHalls){
      const yearsPath = constants.images(townHall)
      const years = await fs.readdir(yearsPath)
      for(const year of years){
        const monthsPath = path.join(yearsPath,year)
        const months = monthsOrdes(await fs.readdir(monthsPath))
        for(const month of months){
          const nominaImages = path.join(monthsPath,month)
          const folder = constants.preData(townHall,year,month)
          const filePath = path.join(folder,"data.txt")
          if(fileExists(filePath)) continue
          const images = await fs.readdir(nominaImages)
          let dataText = ""
          console.log(`converting image to text ${nominaImages}`)
          for(const image of images){
            if(path.extname(image) != ".jpg") continue
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