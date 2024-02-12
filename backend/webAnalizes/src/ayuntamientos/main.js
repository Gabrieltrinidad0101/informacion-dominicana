const {downloadPdf} = require("./downloadPdf/downloadPdf")
const {convertPdfToImage} = require("./convertPdfToImage/convertPdfToImage")
const {getTextFromImage} = require("./getTextFromImage/main")
const {analize} = require("./analize/analize")

void async function (){
  try{
      //await downloadPdf()
      //await convertPdfToImage()
      const text = await getTextFromImage("/home/gabriel/Desktop/Javascript/informacion-dominicana/backend/webAnalizes/src/ayuntamientos/convertPdfToImage/images")
      analize(text)
    }catch(error){
      console.log(error)
    }
}()
