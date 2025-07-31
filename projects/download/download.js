import { DownloaderHelper } from 'node-downloader-helper';
import path from 'path';
import { URL } from 'url';

export class Download {
    constructor(eventBus, fileManager) {
        this.eventBus = eventBus
        this.fileManager = fileManager
        this.eventBus.on('download', 'downloads', (data) => this.download(data))
    }

    getFileNameFromUrl(urlString) {
        const url = new URL(urlString);
        return path.basename(url.pathname);
    }

    download = async (data) => {
        const downloadPath = this.fileManager.makePath(data.instituctionName, data.typeOfData, 'downloadData')
        if (!this.fileManager.fileExists(`${downloadPath}/${this.getFileNameFromUrl(data.link)}`)){
            await this.downloadFile(data.link, downloadPath)
        }
        this.eventBus.emit(
            'postDownloads',
            {
                ...data,
                fileAccess: `${downloadPath}/${this.getFileNameFromUrl(data.link)}`
            })
    }

    downloadFile = (link, folderPath) => new Promise(async (res, rej) => {
        const dl = new DownloaderHelper(link, folderPath);
        dl.on('end', res);
        dl.on('error', rej);
        dl.start().catch(rej);
    })
}