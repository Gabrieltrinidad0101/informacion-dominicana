const path = require("path")
const {getPath} = require("./utils")

const dataPreprocessing = getPath(__dirname,"../../dataPreprocessing")
const datas = (...paths)=> getPath(__dirname,"../../../datas",...paths)
const frontend = path.join(__dirname,"../../../frontend")
const townHalls = (...paths)=> getPath(dataPreprocessing,"townHalls",...paths)
     
const constants = {
    dataPreprocessing,
    datas,
    townHalls,
    downloadData: (townHall,...paths) => townHalls(townHall,"downloadData",...paths),
    images: (townHall,...paths) => townHalls(townHall,"images",...paths),
    imagesTemp: (townHall,...paths) => townHalls(townHall,"imagestemp",...paths),
    preData: (townHall,...paths) => townHalls(townHall,"preData",...paths),
    dataWorldBank: (...paths) => datas("worldBank",...paths),
    frontendTownHall: (townHall)=> path.join(frontend,"src/views/ayuntamientos/",townHall,"topic.js")
}

module.exports = {constants}