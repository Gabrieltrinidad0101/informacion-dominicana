import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

export class FileManagerClient {
    uploadFile = async (localFilePath, folderPath) => {
        const form = new FormData();
        form.append('folderPath', folderPath);
        form.append('file', fs.createReadStream(localFilePath));
        await axios.post(`${'http://filesManager:4000'}/upload`, form, {
            headers: form.getHeaders()
        });
    }

    uploadFileFromUrl = async (url, folderPath) => {
        await axios.post(`${'http://filesManager:4000'}/upload-file-from-url`, {
            url,
            folderPath
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    createTextFile = async (folderPath, fileText) => {
        await axios.post(`${'http://filesManager:4000'}/create-file`, {
            folderPath,
            fileText
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    fileExists = async (filePath) => {
        console.log(`${'http://filesManager:4000'}/file-exists?filePath=${filePath}`)
        const res = await axios.get(`${'http://filesManager:4000'}/file-exists?filePath=${filePath}`);
        return res.data.exists;
    }

    getFile = async (fileUrl) => {
        const res = await axios.get(`${'http://filesManager:4000'}/${fileUrl}`);
        return res.data
    }

    generateUrl = (data, microService, fileName) => {
        return `${data.institutionName}/${data.typeOfData}/${microService}/${data.year}/${data.month}/${fileName}`
    }

    getFileBuffer = async (fileUrl) => {
        try{
            const imageResponse = await axios.get(`http://filesManager:4000/data/${fileUrl}`, {
                responseType: "arraybuffer",
            });
            return imageResponse.data;
        }catch {
            return null
        }
    }


    downloadFile = async (url) => {
        const filePath = path.join("downloads", url);
        const dirPath = path.dirname(filePath);

        fs.mkdirSync(dirPath, { recursive: true });

        const response = await axios.get(`http://filesManager:4000/data/${url}`, {
            responseType: "stream",
        });


        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on("finish", () => resolve(filePath));
            writer.on("error", reject);
        });
    };

}
