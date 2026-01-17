import path from "path";
import fs from "fs";

export class PostDownload {
    constructor({eventBus, fileManagerClient, pdfToText, pdfToImages}) {
        this.eventBus = eventBus;
        this.fileManagerClient = fileManagerClient;
        this.pdfToText = pdfToText;
        this.pdfToImages = pdfToImages;
    }

    init = async () => {
        await this.eventBus.on('postDownload', 'postDownloads', async (data,metadata) => await this.postDownload(data,metadata));
    }

    postDownload = async (data,metadata) => {
        if (!data.urlDownload.includes("pdf")) return;
        await this.fileManagerClient.downloadFile(data.urlDownload);
        // TODO: Extract text from pdf
        // const hasText = await this.pdfToText.extractTextWithPositionFromPdf(data,metadata);
        await this.pdfToImages.convertPdfToImages(new Set(),data,metadata);
        const pdfPath = path.resolve(`downloads/${data.urlDownload}`);
        fs.unlinkSync(pdfPath);
    }
}