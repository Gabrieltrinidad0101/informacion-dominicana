import './envs.js'
import { EventBus } from "../eventBus/eventBus.js"
import { Payroll } from "./payroll/payroll.js"
import { FileManager } from "../filesAccess/fileAccess.js"
import { apiLLMClient } from "./payroll/apiClient.js"

const eventBus = new EventBus()
const fileManager = new FileManager()
const payroll = new Payroll(eventBus, apiLLMClient, fileManager) 
