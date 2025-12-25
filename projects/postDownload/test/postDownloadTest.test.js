import { eventBus } from "../../eventBus/eventBus.js"
import { PostDownload } from "./postDownload.js"
import { PdfToText } from "./pdfText/pdfToText.js"
import { PdfToImages } from "./image/pdfToImages.js"
import { describe, it, expect } from 'vitest'

const triggerEvent = ()=> new Promise((res) => {
    const eventBus = {
        on: (_, _, fc) => {
            res(fc)
        }
    }
})


describe('sum', () => {
    it('Pdf with text', async () => {
        let fileIndex = 0
        const fileManagerClient = {
            downloadFile: (urlDownload) => {
                expect(urlDownload).toBe('test.pdf')
            },
            generateUrl: (data, microService, fileName) => {
                expect(data).toEqual({
                    urlDownload: 'test.pdf'
                })
                expect(microService).toBe('postDownloads')
                expect(fileName).toBe(`${fileIndex}.json`)
                return 'test.pdf'
            },
            fileExists: async (fileUrl) => {
                expect(fileUrl).toBe('test.pdf')
                return false
            },
            createTextFile: async (fileUrl, fileText) => {
                expect(fileUrl).toBe('test.pdf')
            }
        }
        const fc = await triggerEvent()
        fc({
            urlDownload: 'test.pdf'
        })

        const pdfToText = new PdfToText(eventBus, fileManagerClient)
        const pdfToImages = new PdfToImages(fileManagerClient, eventBus)
        new PostDownload({eventBus, fileManagerClient, pdfToText, pdfToImages})    
    })
})
