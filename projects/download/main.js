import { EventBus } from "../eventBus/eventBus.js"
import { FileManager } from "../filesAccess/fileAccess.js"
import { Download } from "./download.js"

const eventBus = new EventBus({
    queueName: "download",
    exchangeName: "downloads"
})

const fileManager = new FileManager()

new Download(eventBus, fileManager)