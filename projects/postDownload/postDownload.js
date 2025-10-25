export class PostDownload {
    constructor({eventBus, fileManagerClient, pdfToText, pdfToImage}) {
        this.eventBus = eventBus;
        this.fileManagerClient = fileManagerClient;
        this.pdfToText = pdfToText;
        this.pdfToImage = pdfToImage;
        this.eventBus.on('postDownload', 'postDownloads', async (data,metadata) => await this.postDownload(data,metadata));
    }

    postDownload = async (data,metadata) => {
        const hasText = await this.pdfToText.extractTextWithPositionFromPdf(data,metadata);
        if(hasText) return
        await this.pdfToImage.getTextFromImage(data,metadata);
    }
}