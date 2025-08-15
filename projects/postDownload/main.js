import { EventBus } from "../eventBus/eventBus.js"
import { FileManager } from "../fileManagerClient/main.js"
import { PdfToImage } from "./image/convertPdfToImage.js"

const eventBus = new EventBus()

const fileManager = new FileManager()

const pdfToImage = new PdfToImage(eventBus, fileManager)