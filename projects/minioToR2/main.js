import "dotenv/config"
import {
    S3Client,
    GetObjectCommand,
    PutObjectCommand,
    HeadObjectCommand,
    ListObjectsV2Command,
} from "@aws-sdk/client-s3"

const MINIO_BUCKET = process.env.MINIO_BUCKET ?? "informacion-dominicana-v2"
const R2_BUCKET = process.env.R2_BUCKET ?? "informacion-dominicana-v2"
const FORCE = process.argv.includes("--force")
const PREFIX = process.argv.find((a, i) => process.argv[i - 1] === "--prefix") ?? ""

const minio = new S3Client({
    region: process.env.REGION ?? "us-east-1",
    endpoint: process.env.ENDPOINT ?? "http://localhost:9000",
    forcePathStyle: true,
    credentials: {
        accessKeyId: process.env.MINIO_ROOT_USER ?? "MINIO_ROOT_USER",
        secretAccessKey: process.env.MINIO_ROOT_PASSWORD ?? "MINIO_ROOT_PASSWORD",
    },
})

const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
})

const listAllKeys = async (prefix) => {
    const keys = []
    let continuationToken = undefined
    do {
        const res = await minio.send(new ListObjectsV2Command({
            Bucket: MINIO_BUCKET,
            Prefix: prefix,
            ContinuationToken: continuationToken,
        }))
        for (const obj of res.Contents ?? []) keys.push(obj.Key)
        continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined
    } while (continuationToken)
    return keys
}

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
        return
    }
    const res = await minio.send(new GetObjectCommand({ Bucket: MINIO_BUCKET, Key: key }))
    const body = Buffer.from(await res.Body.transformToByteArray())
    await r2.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: body,
        ContentType: res.ContentType ?? "application/octet-stream",
    }))
    console.log(`done  ${key}`)
}

const main = async () => {
    console.log(`Listing MinIO files with prefix "${PREFIX}"…`)
    const keys = await listAllKeys(PREFIX)
    console.log(`Found ${keys.length} files. FORCE=${FORCE}`)

    let ok = 0, skipped = 0, failed = 0
    for (const key of keys) {
        try {
            const before = skipped
            await transfer(key)
            if (skipped > before) skipped++
            else ok++
        } catch (err) {
            console.error(`error ${key}: ${err.message}`)
            failed++
        }
    }
    console.log(`\nDone — transferred: ${ok}, skipped: ${skipped}, errors: ${failed}`)
}

main()
