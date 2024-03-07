const {downloadData} = require("./downloadData/downloadData")
const {convertPdfToImage} = require("./convertPdfToImage/convertPdfToImage")
const {getTextFromImage} = require("./getTextFromImage/getTextFromImage")
const {analize} = require("./analize/analize")

void async function (){
  try{
      // await downloadData()
      await convertPdfToImage()
      // await getTextFromImage()
      // await analize()
    }catch(error){
      console.log("Error ",error)
    }
}()
