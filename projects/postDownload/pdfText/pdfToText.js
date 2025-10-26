import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import path from 'path';
import fs from 'fs';

export class PdfToText {
    constructor(eventBus, fileManagerClient) {
        this.eventBus = eventBus;
        this.fileManagerClient = fileManagerClient;
    }

    extractTextWithPositionFromPdf = async (data,metadata) => {
        await this.fileManagerClient.downloadFile(data.urlDownload);
        const pdfPath = path.resolve(`downloads/${data.urlDownload}`);
        const pdfData = new Uint8Array(fs.readFileSync(pdfPath));
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        delete  data._id;
        let hasText = false;
        for (let i = 1; i <= pdf.numPages; i++) {
            const fileUrl = this.fileManagerClient.generateUrl(data, 'analyzeExtractedText', `${i}.json`)
            const pageText = []
            const fileExists = await this.fileManagerClient.fileExists(fileUrl)
            if(fileExists) hasText = true
            if (metadata?.force || !hasText) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
    
                for(const item of content.items) {
                    if(item.str.trim() === '') continue;
                    pageText.push({
                        text: item.str,
                        x: item.transform[4],      
                        y: item.transform[5],      
                        width: item.width,         
                        height: item.height
                    });
                }
                if(!hasText) hasText = pageText.length > 0;
                await this.fileManagerClient.createTextFile(fileUrl, JSON.stringify({lines: pageText, angle: 0}));
            }
            await this.eventBus.emit('aiTextAnalyzers', { ...data, analyzeExtractedTextUrl: fileUrl,index: i },metadata);
        }
        fs.unlinkSync(pdfPath);
        return hasText;
    }
}