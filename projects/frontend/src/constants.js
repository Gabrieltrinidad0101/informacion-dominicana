export default {
    urlData: process.env.SERVER_URL ? `${process.env.SERVER_URL}/data` : "http://127.0.0.1:4000/data",
    apiEvents: process.env.SERVER_URL ?? "http://127.0.0.1:3001",
}