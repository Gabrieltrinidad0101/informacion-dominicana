const path = require("path")
const {getPath} = require("../utils")

const processedData = path.join(__dirname,"../../../processedData")
const townHalls = (...paths)=> getPath(processedData,"townHalls",...paths)
     
const constants = {
    processedData,
    townHalls,
    downloadData: (townHall) => townHalls(townHall,"downloadData"),
    extractedData: ({townHall,year}) => getPath(processedData,"extractedData"),
    preData: (townHall) => townHalls(townHall,"preData"),
    data: ({townHall,year}) => townHalls(townHall,"data")
}

module.exports = {constants}