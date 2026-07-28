import "dotenv/config"
import {
    S3Client,
    PutObjectCommand,
    HeadObjectCommand,
} from "@aws-sdk/client-s3"
import { FileManagerClient } from "../shared/fileManagerClient.js"

const R2_BUCKET = process.env.R2_BUCKET ?? "informaciondominicana"
const FORCE = process.argv.includes("--force")
const PREFIX = process.argv.find((a, i) => process.argv[i - 1] === "--prefix") ?? ""

// Source side (MinIO) reuses the shared client; only the R2 destination needs
// its own S3 client because it points at a different endpoint/bucket.
const minio = new FileManagerClient()

const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
})

const existsInR2 = async (key) => {
    try {
        await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }))
        return true
    } catch {
        return false
    }
}

const transfer = async (key) => {
    if (!FORCE && await existsInR2(key)) {
        console.log(`skip  ${key}`)
        return 'skip'
    }
    const res = await minio.getFileStream(key)
    const body = Buffer.from(await res.Body.transformToByteArray())
    await r2.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: body,
        ContentType: res.ContentType ?? "application/octet-stream",
        ACL: "public-read",
    }))
    console.log(`done  ${key}`)
    return 'done'
}

const main = async () => {
    console.log(`Listing MinIO files with prefix "${PREFIX}"…`)
    const keys = await minio.listFiles(PREFIX)
    console.log(`Found ${keys.length} files. FORCE=${FORCE}`)

    let ok = 0, skipped = 0, failed = 0
    for (const key of keys) {
        try {
            const status = await transfer(key)
            if (status === 'skip') skipped++
            else ok++
        } catch (err) {
            console.error(`error ${key}: ${err.message}`)
            failed++
        }
    }
    console.log(`\nDone — transferred: ${ok}, skipped: ${skipped}, errors: ${failed}`)
}

main()
