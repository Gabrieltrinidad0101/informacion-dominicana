import path from 'path';
import { URL } from 'url';

export class Download {
    constructor(eventBus, fileManagerClient) {
        this.eventBus = eventBus
        this.fileManagerClient = fileManagerClient
        this.eventBus.on('download', 'downloads', async (data) => await this.download(data))
    }

    getFileNameFromUrl(urlString) {
        const url = new URL(urlString);
        return path.basename(url.pathname);
    }

    download = async (data) => {
        const downloadUrl = path.join(data.institutionName, data.typeOfData, 'downloadData',this.getFileNameFromUrl(data.link))
        const fileExists = await this.fileManagerClient.fileExists(downloadUrl)
        if (!fileExists){
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