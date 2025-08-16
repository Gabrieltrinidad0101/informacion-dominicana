import { EventBus } from "../eventBus/eventBus.js"
import { FileManagerClient } from "../fileManagerClient/main.js"
import { PdfToImage } from "./image/convertPdfToImage.js"

const eventBus = new EventBus()

const fileManagerClient = new FileManagerClient()

new PdfToImage(eventBus, fileManagerClient)