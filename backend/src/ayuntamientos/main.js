const {downloadPdf} = require("./downloadData/downloadData")
const {convertPdfToImage} = require("./convertPdfToImage/convertPdfToImage")
const {getTextFromImage} = require("./getTextFromImage/getTextFromImage")
const {analize} = require("./analize/analize")

void async function (){
  try{
      //await downloadPdf()
      //await convertPdfToImage()
      await getTextFromImage()
    }catch(error){
      console.log("Error ",error)
    }
}()
