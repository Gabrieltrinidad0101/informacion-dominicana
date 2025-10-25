import { EventBus } from "../eventBus/eventBus.js"
import { FileManagerClient } from "../fileManagerClient/main.js"
import { PostDownload } from "./postDownload.js"
import { PdfToText } from "./pdfText/pdfText.js"
import { PdfToImages } from "./image/pdfToImages.js"
const eventBus = new EventBus()

const fileManagerClient = new FileManagerClient()
const pdfToText = new PdfToText(eventBus, fileManagerClient)
const pdfToImages = new PdfToImages(fileManagerClient, eventBus)
new PostDownload({eventBus, fileManagerClient, pdfToText, pdfToImages})