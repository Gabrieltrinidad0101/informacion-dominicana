import "dotenv/config"
import {
    S3Client,
    ListObjectsV2Command,
    DeleteObjectsCommand,
} from "@aws-sdk/client-s3"

const R2_BUCKET = process.env.R2_BUCKET ?? "informaciondominicana"
const PREFIX = process.argv.find((a, i) => process.argv[i - 1] === "--prefix") ?? ""
const DRY_RUN = process.argv.includes("--dry-run")

const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
})

const listAllKeys = async () => {
    const keys = []
    let continuationToken = undefined
    do {
        const res = await r2.send(new ListObjectsV2Command({
            Bucket: R2_BUCKET,
            Prefix: PREFIX || undefined,
            ContinuationToken: continuationToken,
        }))
        for (const obj of res.Contents ?? []) keys.push(obj.Key)
        continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined
    } while (continuationToken)
    return keys
}

// DeleteObjects accepts max 1000 keys per request
const deleteChunk = async (keys) => {
    const res = await r2.send(new DeleteObjectsCommand({
        Bucket: R2_BUCKET,
        Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
    }))
    if (res.Errors?.length) {
        for (const e of res.Errors) console.error(`error  ${e.Key}: ${e.Message}`)
    }
}

const main = async () => {
    const label = PREFIX ? `prefix "${PREFIX}"` : "entire bucket"
    console.log(`Listing R2 files in ${label}…`)
    const keys = await listAllKeys()
    console.log(`Found ${keys.length} files. DRY_RUN=${DRY_RUN}`)

    if (keys.length === 0) return

    if (DRY_RUN) {
        keys.forEach((k) => console.log(`would delete  ${k}`))
        return
    }

    let deleted = 0
    for (let i = 0; i < keys.length; i += 1000) {
        const chunk = keys.slice(i, i + 1000)
        await deleteChunk(chunk)
        deleted += chunk.length
        console.log(`Deleted ${deleted}/${keys.length}…`)
    }

    console.log(`\nDone — deleted ${deleted} files from R2.`)
}

main()
