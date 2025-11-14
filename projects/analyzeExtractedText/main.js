import { EventBus } from "../eventBus/eventBus.js"
import { FileManagerClient } from "../fileManagerClient/main.js";
import { AnalyzeExtractedText } from "./src/analyzeExtractedText.js";


const eventBus = new EventBus();
const fileManagerClient = new FileManagerClient();
const analyzeExtractedText = new AnalyzeExtractedText(eventBus, fileManagerClient);
console.log("AnalyzeExtractedText Started");