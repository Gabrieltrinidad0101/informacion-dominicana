import path,{dirname} from "path"
import { fileURLToPath } from 'url';
import { getPath } from "./getPath.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const dataPreprocessing = getPath(__dirname,"../../dataPreprocessing")
const datas = (...paths)=> getPath(__dirname,"../../datas",...paths)
const frontend = path.join(__dirname,"../../frontend")
const townHalls = (...paths)=> getPath(dataPreprocessing,"townHalls",...paths)
const datosOrg = (...paths) => getPath(dataPreprocessing,"datosOrgs",...paths)

export const constants = {
    dataPreprocessing,
    datas,
    datasTownHalls: (...paths) => datas("townHalls",...paths),
    dataWorldBank: (...paths) => datas("worldBank",...paths),
    townHalls,
    downloadData: (townHall,...paths) => townHalls(townHall,"downloadData",...paths),
    images: (townHall,...paths) => townHalls(townHall,"images",...paths),
    preData: (townHall,...paths) => townHalls(townHall,"preData",...paths),
    frontendTownHall: (townHall)=> path.join(frontend,"src/views/TownHalls/",townHall,"topics.js"),
    datosOrg,
    datosOrgTownHalls: (...paths) => datosOrg("townHalls",...paths),  
    townHallData: (townHall,...paths) => townHalls(townHall,"data",...paths)
}

export const CONSTANTS = {
    DOWNLOAD: process.env.DOWNLOAD,
    PdfToImage: process.env.PDF_TO_IMAGE,
    ImageToText: process.env.IMAGE_TO_TEXT,
    AI: process.env.AI,
    AIModel: process.env.AI_MODEL,
    ApiAI: process.env.API_AI,
    ApiModel: process.env.API_MODEL,
    ApiAiKey: process.env.API_AI_KEY
}
