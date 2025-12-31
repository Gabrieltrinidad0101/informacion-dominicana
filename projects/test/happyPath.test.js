import { describe, expect, it } from 'vitest'
import path, { dirname } from "path"
import { fileURLToPath } from 'url';
import dotenv from "dotenv"
import { eventBus } from "../eventBus/eventBus"
import { FileManagerClient } from "../fileManagerClient/main.js"


const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({
    path: path.join(__dirname, ".env")
})

class EventBusTest {
    constructor() {
        this.fileManagerClient = new FileManagerClient()
        this.eventBus = eventBus
        this.eventBus.on('testGetPostDownloads', 'postDownloads', this.postDownloads)
        this.eventBus.on('testExtractedText', 'extractedTexts', this.extractedTexts)
        this.eventBus.on('testDownload', 'downloads', this.downloads)
        this.eventBus.on('testextractedTextAnalyzer', 'extractedTextAnalyzers', this.extractedTextAnalyzers)
        this.eventBus.on('testAiTextAnalyzer', 'aiTextAnalyzers', this.aiTextAnalyzers)
        this.eventBus.on('testInsertData', 'insertDatas', this.insertDatas)
        this.eventBus.emit('downloadLinks', {
            link: "https:ayuntamientojarabacoa.gob.do/transparencia/documentos/nomina/",
            institutionName: "Ayuntamiento de Jarabacoa",
            institutionType: "ayuntamiento",
        })
        
    }

    postDownloads = async (data, metadata) => {
        expect(await this.fileManagerClient.fileExists("test/nomina/download/2023/1/pdfWithImages.pdf")).toBe(true)
    }


    extractedTexts = async (data, metadata) => {
        expect(await this.fileManagerClient.fileExists("test/nomina/postDownloads/2023/1/1.jpg")).toBe(true)
        expect(await this.fileManagerClient.fileExists("test/nomina/postDownloads/2023/1/2.jpg")).toBe(true)
    }

    extractedTextAnalyzers = async (data, metadata) => {
        expect(await this.fileManagerClient.fileExists("test/nomina/extractedTextAnalyzer/2023/1/1.json")).toBe(true)
        expect(await this.fileManagerClient.fileExists("test/nomina/extractedTextAnalyzer/2023/1/2.json")).toBe(true)
    }

    aiTextAnalyzers = async (data, metadata) => {
        expect(await this.fileManagerClient.fileExists("test/nomina/aiTextAnalyzer/2023/1/1.json")).toBe(true)
        expect(await this.fileManagerClient.fileExists("test/nomina/aiTextAnalyzer/2023/1/2.json")).toBe(true)
    }

    insertDatas = async (data, metadata) => {
        expect(await this.fileManagerClient.fileExists("test/nomina/insertData/2023/1/1.json")).toBe(true)
        expect(await this.fileManagerClient.fileExists("test/nomina/insertData/2023/1/2.json")).toBe(true)
    }

}


describe('happyPath', () => {
    it('Happy path', async () => {
        new EventBusTest()
        await new Promise(resolve => setTimeout(resolve, 10000))
    }, 10000)
})
