import path,{dirname} from "path"
import {getPath} from "./utils.js"
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const dataPreprocessing = getPath(__dirname,"../../dataPreprocessing")
const datas = (...paths)=> getPath(__dirname,"../../datas",...paths)
const frontend = path.join(__dirname,"../../frontend")
const townHalls = (...paths)=> getPath(dataPreprocessing,"townHalls",...paths)
     
export const constants = {
    dataPreprocessing,
    datas,
    datasTownHalls: (...paths) => datas("townHalls",...paths),
    townHalls,
    downloadData: (townHall,...paths) => townHalls(townHall,"downloadData",...paths),
    images: (townHall,...paths) => townHalls(townHall,"images",...paths),
    imagesTemp: (townHall,...paths) => townHalls(townHall,"imagestemp",...paths),
    preData: (townHall,...paths) => townHalls(townHall,"preData",...paths),
    dataWorldBank: (...paths) => datas("worldBank",...paths),
    frontendTownHall: (townHall)=> path.join(frontend,"src/views/TownHalls/",townHall,"topics.js"),
    garbageText: path.join(__dirname,"/../garbageText.txt")
}


