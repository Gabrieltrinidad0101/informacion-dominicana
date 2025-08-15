import './envs.js'
import { EventBus } from "../eventBus/eventBus.js"
import { Payroll } from "./payroll/payroll.js"
import { FileManager } from "../fileManagerClient/fileManagerClient.js"
import { apiLLMClient } from "./payroll/apiLLMClient.js"
import { validateIdNumberApi } from './payroll/apiClientValidateDocument.js'
import { encrypt } from './payroll/encrypt.js'
import { ObjectId } from 'mongodb';

const eventBus = new EventBus()
const fileManager = new FileManager()
const getId = () => (new ObjectId()).toString()
new Payroll({
    eventBus,
    apiLLMClient,
    fileManager,
    validateIdNumberApi,
    encrypt,
    getId
}) 
