import { Download } from "./download.js"
import { eventBus } from "../eventBus/eventBus.js"
import { FileManagerClient } from "../fileManagerClient/main.js"

const fileManagerClient = new FileManagerClient()

new Download(eventBus, fileManagerClient)
console.log("Download started")   
