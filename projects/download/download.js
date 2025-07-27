import { exists } from 'fs';
import { DownloaderHelper } from 'node-downloader-helper';
import path from 'path';
import { URL } from 'url';

export class Download {
    constructor(eventBus, fileManager) {
        this.eventBus = eventBus
        this.fileManager = fileManager
        this.eventBus.on('downloadLink', (data) => this.download(data))
    }

    getFileNameFromUrl(urlString) {
        const url = new URL(urlString);
        return path.basename(url.pathname);
    }

    download = async ({ link, typeOfData, instituctionName }) => {
        const downloadPath = this.fileManager.makePath(instituctionName, typeOfData, 'downloadData')
        if (this.fileManager.fileExists(`${downloadPath}/${this.getFileNameFromUrl(link)}`)) return
        await this.downloadFile(link, downloadPath)
    }

    downloadFile = (link, folderPath) => new Promise(async (res, rej) => {
        const dl = new DownloaderHelper(link, folderPath);
        dl.on('end', res);
        dl.on('error', rej);
        dl.start().catch(rej);
    })
}