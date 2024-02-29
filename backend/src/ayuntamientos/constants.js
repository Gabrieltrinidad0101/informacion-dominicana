const path = require("path")
const {getPath} = require("../utils")

const processedData = path.join(__dirname,"../../../processedData")

const constants = {
    processedData,
    townHalls: (...paths)=> getPath(processedData,"townHalls",...paths),
    downloadData: ({townHall,year}) => getPath(processedData,"townHalls",townHall,"downloadData",year),
    extractedData: ({townHall,year}) => getPath(processedData,"extractedData"),
    preData: ({townHall}) => getPath(processedData,townHall,"preData"),
    data: ({townHall,year}) => getPath(processedData,"data"),
}

module.exports = {constants}