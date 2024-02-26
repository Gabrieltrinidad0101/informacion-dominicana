const path = require("path")
const {getPath} = require("../utils")
const processedData = path.join(__dirname,"../../../processedData")

module.exports = {
    processedData,
    downloadData: getPath(processedData,"downloadData"),
    extractedData: getPath(processedData,"extractedData"),
    preData: getPath(processedData,"preData"),
    data: getPath(processedData,"data"),
}