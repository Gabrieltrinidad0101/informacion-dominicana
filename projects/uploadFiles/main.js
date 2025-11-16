import { Download } from "./uploadFiles.js"
import { EventBus } from "../eventBus/eventBus.js"
import { FileManagerClient } from "../fileManagerClient/main.js"

const eventBus = new EventBus()
const fileManagerClient = new FileManagerClient()
new Download(eventBus,fileManagerClient, r2Client);
