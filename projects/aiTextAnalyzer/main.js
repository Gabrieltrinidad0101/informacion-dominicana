import "./env.js"
import { eventBus } from "../eventBus/eventBus.js"
import { Payroll } from "./payroll/payroll.js"
import { FileManagerClient } from "../fileManagerClient/main.js"
import { apiLLMClient } from "./payroll/apiLLMClient.js"
import { validateIdNumberApi } from './payroll/apiClientValidateDocument.js'
import { encrypt } from './payroll/encrypt.js'
import { ObjectId } from 'mongodb';
const fileManagerClient = new FileManagerClient()
const getId = () => (new ObjectId()).toString()
const payroll = new Payroll()
await payroll.init({
    eventBus,
    apiLLMClient,
    fileManagerClient,
    validateIdNumberApi,
    encrypt,
    getId
})
