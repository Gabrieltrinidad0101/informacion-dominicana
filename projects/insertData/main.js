import { EventBus } from "../eventBus/eventBus.js"
import { FileManager } from "../filesAccess/fileAccess.js"
import { InsertData } from './src/insertData.js';
import { Repository } from "./src/repository.js";

const eventBus = new EventBus()
const fileAccess = new FileManager() 
const repository = new Repository()
new InsertData(eventBus, fileAccess, repository)
