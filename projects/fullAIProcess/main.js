import "./env.js"
import { eventBus } from "../eventBus/eventBus.js"
import { FileManagerClient } from "../fileManagerClient/main.js"
import { FullAIProcess } from "./fullAIProcess.js"

const fileManagerClient = new FileManagerClient()
new FullAIProcess(eventBus, fileManagerClient)
console.log("FullAIProcess started")
