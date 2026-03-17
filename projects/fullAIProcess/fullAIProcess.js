import Anthropic from "@anthropic-ai/sdk"
import { PDFDocument } from "pdf-lib"
import { propt } from "./propt.js"

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
})

export class FullAIProcess {
    constructor(eventBus, fileManagerClient) {
        this.eventBus = eventBus
        this.fileManagerClient = fileManagerClient
        this.eventBus.on('fullAIProcess', 'fullAIProcess', async (data, metaData) => await this.process(data, metaData))
    }

    process = async (data, metaData) => {
        const pdfBuffer = await this.fileManagerClient.getFile(data.urlDownload)
        const pdfDoc = await PDFDocument.load(pdfBuffer)
        const pageCount = pdfDoc.getPageCount()

        for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
            await this.processPage(data, metaData, pdfDoc, pageIndex)
        }
    }

    processPage = async (data, metaData, pdfDoc, pageIndex) => {
        const aiTextAnalyzeUrl = this.fileManagerClient.generateUrl(data, 'fullAIProcess', `${pageIndex}.json`)
        const fileExists = await this.fileManagerClient.fileExists(aiTextAnalyzeUrl)

        if (metaData?.force || !fileExists) {
            const singlePageDoc = await PDFDocument.create()
            const [copiedPage] = await singlePageDoc.copyPages(pdfDoc, [pageIndex])
            singlePageDoc.addPage(copiedPage)
            const pageBytes = await singlePageDoc.save()
            const base64Pdf = Buffer.from(pageBytes).toString('base64')

            const message = await anthropic.messages.create({
                model: "claude-sonnet-4-6",
                max_tokens: 8192,
                messages: [{
                    role: "user",
                    content: [
                        {
                            type: "document",
                            source: {
                                type: "base64",
                                media_type: "application/pdf",
                                data: base64Pdf
                            }
                        },
                        {
                            type: "text",
                            text: propt()
                        }
                    ]
                }]
            })

            const rawText = message.content[0].text
                .replaceAll('```json', '')
                .replaceAll('```', '')
                .trim()

            const parsed = JSON.parse(rawText)
            await this.fileManagerClient.createTextFile(aiTextAnalyzeUrl, JSON.stringify({ lines: parsed }))
        }

        await this.eventBus.emit('insertDatas', {
            ...data,
            index: pageIndex,
            aiTextAnalyzeUrl
        }, metaData)
    }
}
