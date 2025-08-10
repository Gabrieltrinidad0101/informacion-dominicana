import { Download } from "./download.js"
import { EventBus } from "../eventBus/eventBus.js"
import { FileManager } from "../filesAccess/fileAccess.js"

const eventBus = new EventBus()

const fileManager = new FileManager()

new Download(eventBus, fileManager)