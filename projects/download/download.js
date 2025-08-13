import path from 'path';
import { URL } from 'url';

import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

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
        const downloadUrl = path.join(data.institutionName, data.typeOfData, 'downloadData',this.getFileNameFromUrl(data.link))
        if (!this.fileManager.fileExists(downloadUrl)){
            await this.fileManagerClient.uploadFileFromUrl(data.link, downloadUrl)
        }
        this.eventBus.emit(
            'postDownloads',
            {
                ...data,
                urlDownload: downloadUrl
            })
    }
}