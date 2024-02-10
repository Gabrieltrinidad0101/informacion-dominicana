const {downloadPdf} = require("./downloadPdf/downloadPdf")
const {convertPdfToImage} = require("./convertPdfToImage/convertPdfToImage")
const {getTextFromImage} = require("./getTextFromImage/main")

void async function (){
    await downloadPdf()
    //await convertPdfToImage()
    //await getTextFromImage()
}()
