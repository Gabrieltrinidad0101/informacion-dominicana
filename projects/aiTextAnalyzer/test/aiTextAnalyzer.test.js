import { describe, expect, it } from 'vitest'
import path, { dirname } from "path"
import { fileURLToPath } from 'url';
import dotenv from "dotenv"
import { eventBus } from "../eventBus/eventBus.js" 
import { Payroll } from "./payroll/payroll.js"
import { FileManagerClient } from "../fileManagerClient/main.js"
import { apiLLMClient } from "./payroll/apiLLMClient.js"
import { validateIdNumberApi } from './payroll/apiClientValidateDocument.js'
import { encrypt } from './payroll/encrypt.js'
import { ObjectId } from 'mongodb';


const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({
    path: path.join(__dirname, ".env")
})

const indeces = {}
const indexGenerate = (key) => {
    if (!indeces[key]) indeces[key] = 1
    return indeces[key]++
}


describe('aiTextAnalyzer', () => {
    it('Happy path', async () => {
        const fileManagerClient = new FileManagerClient()
        const fileManagerClientMockup = {
            ...fileManagerClient,
            fileExists: async () => true,
            getFile: async () => JSON.stringify({
                lines: [
                    {
                        document: '12345678901',
                        isDocumentValid: true
                    }
                ]
            })
        }
        const getId = () => (new ObjectId()).toString()
        new Payroll({
            eventBus,
            apiLLMClient: (text)=>{
                expect(text).includes(JSON.stringify([
                    {
                        document: '12345678901',
                        isDocumentValid: true
                    }
                ]))
            },
            fileManagerClient: fileManagerClientMockup,
            validateIdNumberApi,
            getId
        })


    }, 10000)
})
