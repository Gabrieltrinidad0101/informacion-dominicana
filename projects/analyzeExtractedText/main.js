import { EventBus } from "../eventBus/eventBus.js"
import { AnalyzeExtractedText } from "./src/analyzeExtractedText.js";
import { FileManager } from "../filesAccess/fileAccess.js"

const eventBus = new EventBus();
const fileManager = new FileManager();
const analyzeExtractedText = new AnalyzeExtractedText(eventBus, fileManager);