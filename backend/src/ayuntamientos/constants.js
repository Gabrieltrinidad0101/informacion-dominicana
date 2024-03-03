const path = require("path")
const {getPath} = require("../utils")

const processedData = path.join(__dirname,"../../../processedData")
const frontend = path.join(__dirname,"../../../frontend")
const townHalls = (...paths)=> getPath(processedData,"townHalls",...paths)
     
const constants = {
    processedData,
    townHalls,
    downloadData: (townHall) => townHalls(townHall,"downloadData"),
    images: (townHall) => townHalls(townHall,"images"),
    extractedData: ({townHall,year}) => getPath(processedData,"extractedData"),
    preData: (townHall,...paths) => townHalls(townHall,"preData",...paths),
    datas: (townHall,...paths) => townHalls(townHall,"datas",...paths),
    frontendTownHall: (townHall)=> path.join(frontend,"src/views/ayuntamientos/",townHall,"topic.js")
}

module.exports = {constants}