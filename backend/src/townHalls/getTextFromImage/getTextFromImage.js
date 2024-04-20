import Tesseract,{createWorker} from 'tesseract.js';
import {promises as fs} from 'fs'
import path from 'path';
import { fileExists, monthsOrdes, isNullEmptyUndefinerNan } from '../../utils.js';
import { constants } from '../../constants.js';
import { WebScrapingImageToText } from './scraping.js';
const webScrapingImageToText = new WebScrapingImageToText()
await webScrapingImageToText.start()
export const getTextFromImage = async () => {
  const townHallsPath = constants.townHalls()
  const townHalls = await fs.readdir(townHallsPath)
  for (const townHall of townHalls) {
    if (!isNullEmptyUndefinerNan(path.extname(townHall))) continue
    const yearsPath = constants.images(townHall)
    const years = await fs.readdir(yearsPath)
    for (const year of years) {
      const monthsPath = path.join(yearsPath, year)
      const months = monthsOrdes(await fs.readdir(monthsPath))
      for (const month of months) {
        const nominaImages = path.join(monthsPath, month)
        const folder = constants.preData(townHall, year)
        const filePath = path.join(folder, `${month}.txt`)
        if (fileExists(filePath)) continue
        const images = await fs.readdir(nominaImages)
        let dataText = ""
        console.log(`converting image to text ${nominaImages}`)
        const imagesWithoutOrden = images.sort((a,b) => a.split(".")[1] - b.split(".")[1])
        for (const image of imagesWithoutOrden) {
          if (path.extname(image) != ".jpg") continue
          console.log(`   image to text: ${image}`)
          const imagePath = path.join(nominaImages, image)
          dataText += await webScrapingImageToText.getText(imagePath)
          console.log(dataText)
          // const text = await Tesseract.recognize(path.join(nominaImages, image), 'eng', {
          //   errorHandler: (error) => console.log(error),
          // })
          // dataText += `${clean(text.data.text)}`
        }
        await fs.writeFile(filePath, dataText);
        await new Promise(res => setTimeout(res, 500))
      }
    }
  }
}