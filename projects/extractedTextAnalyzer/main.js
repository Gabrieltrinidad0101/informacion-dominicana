import { eventBus } from "../eventBus/eventBus.js"
import { FileManagerClient } from "../fileManagerClient/main.js";
import { extractedTextAnalyzer } from "./src/extractedTextAnalyzer.js";


const fileManagerClient = new FileManagerClient();
new extractedTextAnalyzer(eventBus, fileManagerClient);
console.log("extractedTextAnalyzer Started");
