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

const indeces = {}
const indexGenerate = (key) =>{
    if(!indeces[key]) indeces[key] = 1
    return indeces[key]++
}

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

    it('Pdf with images', async () => {
        const filePath = '../projects/postDownload/test/downloads/pdfWithImages.pdf'
        const imagesPath = path.join(__dirname,'./images/')
        let index = 1
        const fileManagerClient = {
            downloadFile: (urlDownload) => {
                expect(urlDownload).toBe(filePath)
                fs.copyFileSync(path.join(__dirname,'./data/pdfWithImages.pdf'), path.join(__dirname,'./downloads/pdfWithImages.pdf'))
            },
            generateUrl: (data, microService, fileName) => {
                expect(data).toEqual({
                    urlDownload: filePath
                })
                expect(microService).toBe('extractedTextAnalyzer')
                expect(fileName).toBe(`${index}.json`)
                index++
                return filePath
            },
            fileExists: async (fileUrl) => {
                expect(fileUrl).toBe(filePath)
                return false
            },
            createTextFile: async (fileUrl,data) => {
                throw new Error("Method should not be called")
            }
        }

        const eventBusPdfText = {
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
                throw new Error("Method should not be called")
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
                expect(event).toBe('extractedTexts')
                expect(data).toEqual({
                    urlDownload: filePath,
                    imageUrl: path.join(imagesPath,`_.${indexGenerate("imageIndexEmit1")}.jpg`),
                    index: indexGenerate("imageIndexEmit2")
                })
                expect(metadata).toEqual({
                    force: false
                })
            }
        }
        let firstTimeGenerateUrl = true

        const fileManagerClientPdfImages = {
            generateUrl: (data, microService, fileName) => {
                expect(data).toEqual({
                    urlDownload: filePath
                })
                expect(microService).toBe('postDownloads')
                if(firstTimeGenerateUrl) {
                    firstTimeGenerateUrl = false
                    expect(fileName).toBe('')
                    fs.mkdirSync(imagesPath, { recursive: true });
                    return imagesPath
                }else {
                    expect(fileName).toBe(`_.${indexGenerate("imageIndexGenerateUrl1")}.jpg`)
                    return path.join(imagesPath,fileName)
                }
            },
            fileExists: async () => {
                return false
            },
            uploadFile: async (filePath, fileUrl) => {
                fs.existsSync(filePath)
                expect(filePath).toBe(path.join(imagesPath,`_.${indexGenerate("imageIndexUpload1")}.jpg`))
                expect(fileUrl).toBe(path.join(imagesPath,`_.${indexGenerate("imageIndexUpload2")}.jpg`))
            },
            downloadFile: (urlDownload) => {
                expect(urlDownload).toBe(filePath)
                fs.copyFileSync(path.join(__dirname,'./data/pdfWithText.pdf'), path.join(__dirname,'./downloads/pdfWithText.pdf'))
            },
        }

        const pdfToText = new PdfToText(eventBusPdfText, fileManagerClient)
        const pdfToImages = new PdfToImages(fileManagerClientPdfImages, eventBus)
        const pdfToImagesMockup = {
            ...pdfToImages,
            convertPdfToImages: async (hasText,data,metadata) => {
                expect(hasText).toEqual([])
                return pdfToImages.convertPdfToImages(hasText,data,metadata)
            }
        }
        const postDownload = new PostDownload({eventBus, fileManagerClient, pdfToText, pdfToImages:pdfToImagesMockup})    
        await postDownload.init()
        expect(fs.existsSync(imagesPath)).toBe(false)
    }, 10000)
})
