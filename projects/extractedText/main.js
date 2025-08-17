import './envs.js'
import { EventBus } from "../eventBus/eventBus.js"
import { ImageToText } from "./image/getTextFromImage.js"
import { FileManagerClient } from "../fileManagerClient/main.js"

const eventBus = new EventBus()

const fileManager = new FileManagerClient()

new ImageToText(eventBus, fileManager)