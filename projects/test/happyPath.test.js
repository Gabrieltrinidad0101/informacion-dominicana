import { describe, expect, it } from 'vitest'
import path, { dirname } from "path"
import { fileURLToPath } from 'url';
import dotenv from "dotenv"


const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({
    path: path.join(__dirname, ".env")
})

class EventFileManager {
    constructor(fileClientManager) {
        this.fileClientManager = fileClientManager
        this.eventBus.on('testDownloadLink', 'downloadLinks', this.downloadLinks)
        this.eventBus.on('testGetPostDownloads', 'postDownloads', this.postDownloads)
        this.eventBus.on('testExtractedText', 'extractedTexts', this.extractedTexts)
        this.eventBus.on('testDownload', 'downloads', this.downloads)
        this.eventBus.on('testextractedTextAnalyzer', 'extractedTextAnalyzers', this.extractedTextAnalyzers)
        this.eventBus.on('testAiTextAnalyzer', 'aiTextAnalyzers', this.aiTextAnalyzers)
        this.eventBus.on('testInsertData', 'insertDatas', this.insertDatas)
        this.eventBus.on('testPayrollExportToJsons', 'payrollExportToJsons', this.payrollExportToJsons)
    }

    postDownloads = async (data, metadata) => {
        expect(await this.fileClientManager.fileExists("test/nomina/download/2023/1/pdfWithImages.pdf")).toBe(true)
    }


    extractedTexts = async (data, metadata) => {
        expect(await this.fileClientManager.fileExists("test/nomina/postDownloads/2023/1/1.jpg")).toBe(true)
        expect(await this.fileClientManager.fileExists("test/nomina/postDownloads/2023/1/2.jpg")).toBe(true)
    }

    extractedTextAnalyzers = async (data, metadata) => {
        expect(await this.fileClientManager.fileExists("test/nomina/extractedTextAnalyzer/2023/1/1.json")).toBe(true)
        expect(await this.fileClientManager.fileExists("test/nomina/extractedTextAnalyzer/2023/1/2.json")).toBe(true)
    }

    aiTextAnalyzers = async (data, metadata) => {
        expect(await this.fileClientManager.fileExists("test/nomina/aiTextAnalyzer/2023/1/1.json")).toBe(true)
        expect(await this.fileClientManager.fileExists("test/nomina/aiTextAnalyzer/2023/1/2.json")).toBe(true)
    }

    insertDatas = async (data, metadata) => {
        expect(await this.fileClientManager.fileExists("test/nomina/insertData/2023/1/1.json")).toBe(true)
        expect(await this.fileClientManager.fileExists("test/nomina/insertData/2023/1/2.json")).toBe(true)
    }

}


describe('happyPath', () => {
    it('Happy path', async () => {
        

    }, 10000)
})
