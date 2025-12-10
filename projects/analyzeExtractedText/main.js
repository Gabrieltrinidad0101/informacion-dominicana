import { eventBus } from "../eventBus/eventBus.js"
import { FileManagerClient } from "../fileManagerClient/main.js";
import { AnalyzeExtractedText } from "./src/analyzeExtractedText.js";


const fileManagerClient = new FileManagerClient();
new AnalyzeExtractedText(eventBus, fileManagerClient);
console.log("AnalyzeExtractedText Started");
