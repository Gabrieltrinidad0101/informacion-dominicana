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

        for (let pageIndex = pageCount - 1; pageIndex < pageCount; pageIndex++) {
            console.log("stated")
            await this.processPage(data, metaData, pdfDoc, pageIndex)
        }
    }

    processPage = async (data, metaData, pdfDoc, pageIndex) => {
        const aiTextAnalyzeUrl = this.fileManagerClient.generateUrl(data, 'fullAIProcess', `${pageIndex}.json`)
        const fileExists = await this.fileManagerClient.fileExists(aiTextAnalyzeUrl)
        return
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
            const lines = this.parse(message.content[0].text)
            await this.fileManagerClient.createTextFile(aiTextAnalyzeUrl, JSON.stringify({ lines }))
        }

        await this.eventBus.emit('insertDatas', {
            ...data,
            index: pageIndex,
            aiTextAnalyzeUrl
        }, metaData)
    }

    parse = (text) => {
        return text.split("\n").map(line => {
            const [
                name, document, position, income, sex,accountBack, phoneNumber
            ] = line.split("|");

            return {
                name,
                document,
                position,
                income,
                sex,
                accountBack,
                phoneNumber,
            };
        });
    };
}


