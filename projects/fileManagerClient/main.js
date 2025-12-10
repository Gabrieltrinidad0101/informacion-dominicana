import {
    S3Client,
    PutObjectCommand,
    HeadObjectCommand,
    GetObjectCommand
} from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import axios from "axios";
import { Readable } from "stream";

export class FileManagerClient {
    constructor(data) {
        this.s3 = new S3Client({
            region: data?.REGION ?? "us-east-1",
            endpoint: data?.ENDPOINT ?? "http://localhost:9001",
            forcePathStyle: true,
            credentials: {
                accessKeyId: data?.MINIO_ROOT_USER ?? "MINIO_ROOT_USER",
                secretAccessKey: data?.MINIO_ROOT_PASSWORD ?? "MINIO_ROOT_PASSWORD"
            }
        });

        this.bucket = data.BUCKET ?? "informacion-dominicana";
    }

    uploadFile = async (localFilePath, folderPath) => {
        const fileStream = fs.createReadStream(localFilePath);
        const fileName = path.basename(localFilePath);

        const Key = `${folderPath}/${fileName}`;

        await this.s3.send(new PutObjectCommand({
            Bucket: this.bucket,
            Key,
            Body: fileStream
        }));

        return Key;
    };

    uploadFileFromUrl = async (url, folderPath) => {
        const response = await axios.get(url, { responseType: "arraybuffer" });

        const fileName = url.split("/").pop();
        const Key = `${folderPath}/${fileName}`;

        await this.s3.send(new PutObjectCommand({
            Bucket: this.bucket,
            Key,
            Body: response.data
        }));

        return Key;
    };

    createTextFile = async (folderPath, fileText) => {
        const Key = `${folderPath}`;

        await this.s3.send(new PutObjectCommand({
            Bucket: this.bucket,
            Key,
            Body: fileText,
            ContentType: "text/plain"
        }));

        return Key;
    };

    fileExists = async (filePath) => {
        try {
            await this.s3.send(new HeadObjectCommand({
                Bucket: this.bucket,
                Key: filePath
            }));
            return true;
        } catch (e) {
            return false;
        }
    };

    getFile = async (fileUrl) => {
        const res = await this.s3.send(new GetObjectCommand({
            Bucket: this.bucket,
            Key: fileUrl
        }));

        return Buffer.from(await res.Body.transformToByteArray());
    };

    getFileUint8Array = async (fileUrl) => {
        const res = await this.s3.send(new GetObjectCommand({
            Bucket: this.bucket,
            Key: fileUrl
        }));

        return new Uint8Array(await res.Body.transformToByteArray());
    };

    generateUrl = (data, microService, fileName) => {
        return `${data.institutionName}/${data.typeOfData}/${microService}/${data.year}/${data.month}/${fileName}`;
    };

    getFileBuffer = async (fileUrl) => {
        try {
            const res = await this.s3.send(new GetObjectCommand({
                Bucket: this.bucket,
                Key: fileUrl
            }));
            return Buffer.from(await res.Body.transformToByteArray());
        } catch {
            return null;
        }
    };

    downloadFile = async (url) => {
        const res = await this.s3.send(new GetObjectCommand({
            Bucket: this.bucket,
            Key: url
        }));

        const filePath = path.join("downloads", url);
        const dirPath = path.dirname(filePath);

        fs.mkdirSync(dirPath, { recursive: true });

        const stream = Readable.from(await res.Body.transformToByteArray());
        const writer = fs.createWriteStream(filePath);

        stream.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on("finish", () => resolve(filePath));
            writer.on("error", reject);
        });
    };
}
