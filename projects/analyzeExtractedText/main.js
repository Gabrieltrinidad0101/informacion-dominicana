import { AnalyzeExtractedText } from "./src/analyzeExtractedText";
import { EventBus } from "./src/eventBus";
import { FileManager } from "./src/fileManager";

const eventBus = new EventBus();
const fileManager = new FileManager();
const analyzeExtractedText = new AnalyzeExtractedText(eventBus, fileManager);   