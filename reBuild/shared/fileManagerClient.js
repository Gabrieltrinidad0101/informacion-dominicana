import {
    S3Client,
    PutObjectCommand,
    HeadObjectCommand,
    GetObjectCommand,
    ListObjectsV2Command
} from "@aws-sdk/client-s3"
import axios from "axios"

export class FileManagerClient {
    constructor() {
        this.s3 = new S3Client({
            region: process.env.REGION ?? "us-east-1",
            endpoint: process.env.ENDPOINT ?? "http://localhost:9000",
            forcePathStyle: true,
            credentials: {
                accessKeyId: process.env.MINIO_ROOT_USER ?? "MINIO_ROOT_USER",
                secretAccessKey: process.env.MINIO_ROOT_PASSWORD ?? "MINIO_ROOT_PASSWORD"
            }
        })
        this.bucket = "informacion-dominicana-v2"
    }

    uploadFileFromUrl = async (url, key) => {
        const response = await axios.get(url, { responseType: "arraybuffer" })
        await this.s3.send(new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: response.data
        }))
        return key
    }

    uploadBuffer = async (key, buffer, contentType = "application/octet-stream") => {
        await this.s3.send(new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType
        }))
        return key
    }

    createTextFile = async (key, text) => {
        await this.s3.send(new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: text,
            ContentType: "application/json"
        }))
        return key
    }

    fileExists = async (key) => {
        try {
            await this.s3.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }))
            return true
        } catch {
            return false
        }
    }

    getFile = async (key) => {
        const res = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }))
        return Buffer.from(await res.Body.transformToByteArray())
    }

    getFileStream = async (key) => {
        return await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }))
    }

    // Returns all object keys under a given prefix
    listFiles = async (prefix) => {
        const keys = []
        let continuationToken = undefined
        do {
            const res = await this.s3.send(new ListObjectsV2Command({
                Bucket: this.bucket,
                Prefix: prefix,
                ContinuationToken: continuationToken
            }))
            for (const obj of res.Contents ?? []) {
                keys.push(obj.Key)
            }
            continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined
        } while (continuationToken)
        return keys
    }

    // downloadPath → aiProcess path
    // e.g. InstitutionName/nomina/download/2024/enero/file.pdf
    //    → InstitutionName/nomina/aiProcess/2024/enero/file.json
    toAiPath = (downloadKey) => {
        return "/" + downloadKey
            .replace("/download/", "/aiProcess/")
            .replace(/\.[^/.]+$/, ".json")
    }

    // aiProcess path → insertData path (same, just for clarity)
    parsePathMeta = (key) => {
        const parts = key.split("/")
        // parts: [institutionName, typeOfData, microService, year, month, filename]
        return {
            institutionName: parts[0],
            typeOfData: parts[1],
            year: parts[3],
            month: parts[4],
            filename: parts[5]
        }
    }
}
