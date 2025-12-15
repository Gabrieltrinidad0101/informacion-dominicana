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
            region: process.env.REGION ?? "us-east-1",
            endpoint: process.env.ENDPOINT ?? "http://minio:9000",
            forcePathStyle: true,
            credentials: {
                accessKeyId: process.env.MINIO_ROOT_USER ?? "MINIO_ROOT_USER",
                secretAccessKey: process.env.MINIO_ROOT_PASSWORD ?? "MINIO_ROOT_PASSWORD"
            }
        });

        this.bucket = data?.BUCKET ?? "informacion-dominicana";
    }

    uploadFile = async (localFilePath, folderPath) => {
        const fileStream = fs.createReadStream(localFilePath);
        const Key = folderPath;

        await this.s3.send(new PutObjectCommand({
            Bucket: this.bucket,
            Key,
            Body: fileStream
        }));

        return Key;
    };

    uploadFileFromUrl = async (url, folderPath) => {
        const response = await axios.get(url, { responseType: "arraybuffer" });

        const Key = folderPath;
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
        console.log(fileUrl)
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
        const res = await this.s3.send(
            new GetObjectCommand({
                Bucket: this.bucket,
                Key: url,
            })
        );

        const filePath = path.join("downloads", url);
        const dirPath = path.dirname(filePath);

        fs.mkdirSync(dirPath, { recursive: true });

        const body = res.Body;
        const writer = fs.createWriteStream(filePath);

        body.pipe(writer);

        return new Promise((resolve, reject) => {
        writer.on("finish", () => resolve(filePath));
        writer.on("error", reject);
        });

    };
}
