const path = require("path")
const {getPath} = require("../utils")

const processedData = path.join(__dirname,"../../../processedData")
const townHalls = (...paths)=> getPath(processedData,"townHalls",...paths)
     
const constants = {
    processedData,
    townHalls,
    downloadData: ({townHall,year}) => getPath(processedData,"townHalls",townHall,"downloadData",year),
    extractedData: ({townHall,year}) => getPath(processedData,"extractedData"),
    preData: (townHall) => townHalls(townHall,"preData"),
    data: ({townHall,year}) => getPath(processedData,"data"),
}

module.exports = {constants}