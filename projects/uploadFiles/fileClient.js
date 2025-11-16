class FileClient {
    constructor(s3Client, bucket) {
        this.s3 = s3Client;
        this.bucket = bucket;
    }

    async fileExists(key) {
        try {
            await this.s3.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
            return true;
        } catch (err) {
            if (err.$metadata?.httpStatusCode === 404) return false;
            return false;
        }
    }

    async uploadFromUrl(url, key) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Download failed: ${url}`);

        const body = await res.arrayBuffer();

        await this.s3.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: Buffer.from(body),
                ContentType: res.headers.get("content-type") ?? "application/octet-stream",
            })
        );
    }
}
