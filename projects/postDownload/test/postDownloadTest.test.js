import { PostDownload } from "../src/postDownload.js"
import { PdfToText } from "../src/pdfText/pdfToText.js"
import { PdfToImages } from "../src/image/pdfToImages.js"
import { describe, it, expect } from 'vitest'
import path,{dirname} from "path"
import { fileURLToPath } from 'url';
import dotenv from "dotenv"
import fs from "fs"
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({
    path: path.join(__dirname,".env")
})

describe('postDownload', () => {
    it('Pdf with text', async () => {
        const filePath = '../projects/postDownload/test/downloads/pdfWithText.pdf'
        const fileManagerClient = {
            downloadFile: (urlDownload) => {
                expect(urlDownload).toBe(filePath)
                fs.copyFileSync(path.join(__dirname,'./data/pdfWithText.pdf'), path.join(__dirname,'./downloads/pdfWithText.pdf'))
            },
            generateUrl: (data, microService, fileName) => {
                expect(data).toEqual({
                    urlDownload: filePath
                })
                expect(microService).toBe('extractedTextAnalyzer')
                expect(fileName).toBe(`1.json`)
                return filePath
            },
            fileExists: async (fileUrl) => {
                expect(fileUrl).toBe(filePath)
                return false
            },
            createTextFile: async (fileUrl,data) => {
                expect(fileUrl).toBe(filePath)
                expect(data).toEqual(JSON.stringify(JSON.parse(fs.readFileSync(path.join(__dirname,'./data/pdfWithText.json')))))
            }
        }

        const eventBus = {
            on: async (event, exchange, fc) => {
                expect(event).toBe('postDownload')
                expect(exchange).toBe('postDownloads')
                expect(fc).toBeInstanceOf(Function)
                await fc({
                    urlDownload: filePath
                },
                {
                    force: false
                }
            )
            },
            emit: async (event, data, metadata) => {
                expect(event).toBe('aiTextAnalyzers')
                expect(data).toEqual({
                    urlDownload: filePath,
                    extractedTextAnalyzerUrl: filePath,
                    index: 1
                })
                expect(metadata).toEqual({
                    force: false
                })
            }
        }

        const fileManagerClientPdfImages = {
            generateUrl: (data, microService, fileName) => {
                expect(data).toEqual({
                    urlDownload: filePath
                })
                expect(microService).toBe('postDownloads')
                expect(fileName).toBe('')
                return filePath
            },
            downloadFile: (urlDownload) => {
                expect(urlDownload).toBe(filePath)
                fs.copyFileSync(path.join(__dirname,'./data/pdfWithText.pdf'), path.join(__dirname,'./downloads/pdfWithText.pdf'))
            },
        }


        const pdfToText = new PdfToText(eventBus, fileManagerClient)
        const pdfToImages = new PdfToImages(fileManagerClientPdfImages, eventBus)
        const postDownload = new PostDownload({eventBus, fileManagerClient, pdfToText, pdfToImages})    
        await postDownload.init()
    })
})
