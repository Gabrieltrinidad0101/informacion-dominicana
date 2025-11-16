import path from "path";
import { URL } from "url";

export class UploadFiles {
    constructor(eventBus, r2Client) {
        this.eventBus = eventBus;
        this.r2 = r2Client;

        this.eventBus.on(
            "uploadFile",
            "uploadFiles",
            async (data,metadata) => await this.uploadFile(data,metadata)
        );
    }

    getFileNameFromUrl(urlString) {
        const url = new URL(urlString);
        return path.basename(url.pathname);
    }

    uploadFile = async (data,metadata) => {
        const objectKey = path.join(
            data.institutionName,
            data.typeOfData,
            "uploadFileData",
            this.getFileNameFromUrl(data.link)
        );
        await this.r2.uploadFromUrl(data.link, objectKey);
    };
}
