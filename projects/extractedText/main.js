import './envs.js'
import { EventBus } from "../eventBus/eventBus.js"
import { FileManager } from "../filesAccess/fileAccess.js"
import { ImageToText } from "./image/getTextFromImage.js"

const eventBus = new EventBus()

const fileManager = new FileManager()

new ImageToText(eventBus, fileManager)