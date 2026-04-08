import { UploadFiles } from "./uploadFiles.js"
import { eventBus } from "../../eventBus/eventBus.js"
import { FileManagerClient } from "../../fileManagerClient/main.js"

const fileManagerClient = new FileManagerClient();
const fileManagerClientPro = new FileManagerClient({
    BUCKET: "informacion-dominicana",
    ENDPOINT: process.env.R2_ENDPOINT,
    REGION: "auto",
    ACCESS_KEY: process.env.R2_ACCESS_KEY,
    SECRET_KEY: process.env.R2_SECRET_KEY
});
new UploadFiles(eventBus,fileManagerClient, fileManagerClientPro);
