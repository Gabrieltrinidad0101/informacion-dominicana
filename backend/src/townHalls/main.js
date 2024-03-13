import dotenv from "dotenv"
dotenv.config()
import { downloadData } from "./downloadData/downloadData.js"
import { convertPdfToImage } from "./convertPdfToImage/convertPdfToImage.js"
import { getTextFromImage } from "./getTextFromImage/getTextFromImage.js"
import { analize } from "./analize/analize.js"

try {
  // await downloadData()
  await convertPdfToImage()
  await getTextFromImage()
  await analize()
} catch (error) {
  console.log("Error ", error)
}