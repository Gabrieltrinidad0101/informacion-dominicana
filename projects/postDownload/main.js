import { EventBus } from "../eventBus/eventBus.js"
import { FileManager } from "../filesAccess/fileAccess.js"
import { PdfToImage } from "./image/convertPdfToImage.js"

const eventBus = new EventBus({
    queueName: "postDownload",
    exchangeName: "postDownload"
})

const fileManager = new FileManager()

const pdfToImage = new PdfToImage(eventBus, fileManager)