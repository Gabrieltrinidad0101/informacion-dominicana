import { EventBus } from "../eventBus/eventBus.js"
import { FileManagerClient } from "../fileManagerClient/main.js"
import { InsertData } from './src/insertData.js';
import { Repository } from "./src/repository.js";

const eventBus = new EventBus()
const fileManagerClient = new FileManagerClient() 
const repository = new Repository()
new InsertData(eventBus, fileManagerClient, repository)