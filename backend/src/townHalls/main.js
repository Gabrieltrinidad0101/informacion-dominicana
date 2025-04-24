import './loadEnv.js'
import { downloadData } from "./downloadData/downloadData.js"
import { convertPdfToImage } from "./convertPdfToImage/convertPdfToImage.js"
import { getTextFromImage } from "./getTextFromImage/getTextFromImage.js"
import { Ai } from "./ai/ai.js"
import { CONSTANTS } from "../constants.js"
import { analyze } from './analyze/analyze.js'

try {
  if(CONSTANTS.DOWNLOAD === "1") await downloadData()
  if(CONSTANTS.PdfToImage === "1") await convertPdfToImage()
  if(CONSTANTS.ImageToText === "1") await getTextFromImage()
  if(CONSTANTS.AI === "1") await Ai()
  if(CONSTANTS.Analyze === "1") await analyze()
} catch (error) {
  console.log("Error ", error)
}