import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';


export class PdfToText {
    constructor(eventBus, fileManagerClient) {
        this.eventBus = eventBus;
        this.fileManagerClient = fileManagerClient;
    }

    extractTextWithPositionFromPdf = async (data) => {
        const data = fileManagerClient.getFileUint8Array(data.urlDownload)
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        let hasText = false;
        for (let i = 1; i <= pdf.numPages; i++) {
            const fileUrl = this.fileManagerClient.generateUrl(data, 'analyzeExtractedText', `${i}.json`)
            const pageText = []
            if (metadata?.force || !await this.fileManagerClient.fileExists(fileUrl)) {
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
            }
            if(!hasText) hasText = pageText.length > 0;
            await this.fileManagerClient.createTextFile(fileUrl, JSON.stringify(pageText));
            await this.eventBus.emit('aiTextAnalyzers', { ...data, analyzeExtractedTextUrl: fileUrl },metadata);
        }

        return hasText;
    }
}