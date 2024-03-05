const path = require("path")
const {getPath} = require("./utils")

const dataPreprocessing = getPath(__dirname,"../../../dataPreprocessing")
const datas = (...paths)=> getPath(__dirname,"../../../datas",...paths)
const frontend = path.join(__dirname,"../../../frontend")
const townHalls = (...paths)=> getPath(dataPreprocessing,"townHalls",...paths)
     
const constants = {
    dataPreprocessing,
    datas,
    townHalls,
    downloadData: (townHall) => townHalls(townHall,"downloadData"),
    images: (townHall) => townHalls(townHall,"images"),
    extractedData: ({townHall,year}) => getPath(dataPreprocessing,"extractedData"),
    preData: (townHall,...paths) => townHalls(townHall,"preData",...paths),
    dataWorldBank: (...paths) => datas(...paths),
    frontendTownHall: (townHall)=> path.join(frontend,"src/views/ayuntamientos/",townHall,"topic.js")
}

module.exports = {constants}