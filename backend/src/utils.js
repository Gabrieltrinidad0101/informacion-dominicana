const fs = require("fs");

const getPath = (...paths)=>{
    const pathToReturn = path.join(...paths)
    if(pathToReturn === "") return pathToReturn
    fs.mkdir(pathToReturn,{ recursive: true }).catch((error)=>{console.log(error)})
    return pathToReturn
  }

function fileExists(filePath) {
    return new Promise((resolve, reject) => {
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    resolve(false); // File does not exist
                } else {
                    reject(err); // Other error
                }
            } else {
                resolve(true); // File exists
            }
        });
    });
}

/**
 * 
 * @param {string} text 
 */

const getMonth = (text) => {
    const textloweCase = text.toLowerCase()
    if (textloweCase.includes("enero")) return "january"
    if (textloweCase.includes("febrero") || textloweCase.includes("feb")) return "february"
    if (textloweCase.includes("marzo")) return "march"
    if (textloweCase.includes("abril")) return "april"
    if (textloweCase.includes("mayo")) return "may"
    if (textloweCase.includes("junio")) return "june"
    if (textloweCase.includes("julio")) return "july"
    if (textloweCase.includes("agosto")) return "august"
    if (textloweCase.includes("septiembre")) return "september"
    if (textloweCase.includes("octubre")) return "october"
    if (textloweCase.includes("noviembre") || textloweCase === "11.pdf") return "november"
    if (textloweCase.includes("diciembre")) return "december"
}

const getNumberOfMonth = (text) => {
    if (text === "january") return "01"
    if (text === "february") return "02"
    if (text === "march") return "03"
    if (text === "april") return "04"
    if (text === "may") return "05"
    if (text === "june") return "06"
    if (text === "july") return "07"
    if (text === "august") return "08"
    if (text === "september") return "09"
    if (text === "october") return "10"
    if (text === "november") return "11"
    if (text === "december") return "12"
}

/**
 * 
 * @param {Array<string>} months 
 */
const monthsOrdes = (months) => {
    const monthOrder = {
        january: 1,
        february: 2,
        feb: 2,
        march: 3,
        april: 4,
        may: 5,
        june: 6,
        july: 7,
        august: 8,
        september: 9,
        october: 10,
        november: 11,
        december: 12
    }

    return months.sort((a, b) => monthOrder[a.toLocaleLowerCase()] - monthOrder[b.toLocaleLowerCase()]);
}

module.exports = { fileExists, getMonth, getNumberOfMonth,monthsOrdes,getPath }