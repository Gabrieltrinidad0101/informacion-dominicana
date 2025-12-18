export class UploadFiles {
    constructor(eventBus, fileManagerClient, fileManagerClientPro) {
        this.eventBus = eventBus;
        this.fileManagerClient = fileManagerClient;
        this.fileManagerClientPro = fileManagerClientPro;

        this.eventBus.on(
            "uploadFile",
            "uploadFiles",
            async (data,metadata) => await this.uploadFile(data,metadata)
        );
    }

    uploadFile = async (data) => {
        const res = await this.fileManagerClient.getFileStream(data.fileToUpload);
        await this.fileManagerClientPro.uploadFileFromStream(res.Body, data.filePath, res.contentType);
    };
}
