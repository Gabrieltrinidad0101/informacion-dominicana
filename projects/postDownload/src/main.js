import { eventBus } from "../../eventBus/eventBus.js"
import { FileManagerClient } from "../../fileManagerClient/main.js"
import { PostDownload } from "./postDownload.js"
import { PdfToText } from "./pdfText/pdfToText.js"
import { PdfToImages } from "./image/pdfToImages.js"

const fileManagerClient = new FileManagerClient()
const pdfToText = new PdfToText(eventBus, fileManagerClient)
const pdfToImages = new PdfToImages(fileManagerClient, eventBus)
const postDownload = new PostDownload({eventBus, fileManagerClient, pdfToText, pdfToImages})    
postDownload.init() 
console.log("PostDownload started")