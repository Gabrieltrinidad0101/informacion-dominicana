import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

export class FileManager {
    uploadFile = async (localFilePath, folderPath) => {
        const form = new FormData();
        form.append('file', fs.createReadStream(localFilePath));
        form.append('folderPath', folderPath);
        await axios.post(`${process.env.API_URL}/upload`, form, {
            headers: form.getHeaders()
        });
    }

    uploadFileFromUrl = async (url, folderPath) => {
        await axios.post(`${process.env.API_URL}/upload-file-from-url`, {
            url,
            folderPath
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    createTextFile = async (folderPath, fileText) => {
        await axios.post(`${process.env.API_URL}/create-file`, {
            folderPath,
            fileText
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    fileExists = async (filePath) => {
        const res = await axios.get(`${process.env.API_URL}/file-exists?filePath=${filePath}`);
        return res.data.exists;
    }

    getFile = async (fileUrl) => {
        const res = await axios.get(`${process.env.API_URL}/${fileUrl}`);
        return res.data
    }

    generatePath = (data, microService, fileName) => {
        return `${data.institutionName}/${data.typeOfData}/${microService}/${data.year}/${data.month}/${fileName}`
    }

    downloadFile = async (url) => {
        const response = await axios.get(url, {
            responseType: "stream",
        });

        const writer = fs.createWriteStream(url);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });
    }

}
