import { Download } from "./uploadFiles.js"
import { eventBus } from "../eventBus/eventBus.js"
import { FileManagerClient } from "../fileManagerClient/main.js"

const fileManagerClient = new FileManagerClient()
new Download(eventBus,fileManagerClient, r2Client);
