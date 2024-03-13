import dotenv from "dotenv"
dotenv.config()
import { downloadData } from "./downloadData/downloadData"
import { convertPdfToImage } from "./convertPdfToImage/convertPdfToImage"
import { getTextFromImage } from "./getTextFromImage/getTextFromImage"
import { analize } from "./analize/analize"

void async function () {
  try {
    // await downloadData()
    await convertPdfToImage()
    await getTextFromImage()
    await analize()
  } catch (error) {
    console.log("Error ", error)
  }
}()