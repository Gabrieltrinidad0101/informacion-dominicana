const fs = require("fs");

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

const getMonth = (text)=>{
    if(text.toLowerCase().includes("enero")) return "january"
    if(text.toLowerCase().includes("febrero")) return "february"
    if(text.toLowerCase().includes("marzo")) return "march"
    if(text.toLowerCase().includes("abril")) return "april"
    if(text.toLowerCase().includes("mayo")) return "may"
    if(text.toLowerCase().includes("junio")) return "june"
    if(text.toLowerCase().includes("julio")) return "july"
    if(text.toLowerCase().includes("agosto")) return "august"
    if(text.toLowerCase().includes("septiembre")) return "september" 
    if(text.toLowerCase().includes("octubre")) return "october"
    if(text.toLowerCase().includes("noviembre")) return "november"
    if(text.toLowerCase().includes("diciembre")) return "december"
}

const getNumberOfMonth = (text)=>{
    if(text === "january") return "01"
    if(text === "february") return "02"
    if(text === "march") return "03"
    if(text === "april") return "04"
    if(text === "may") return "05"
    if(text === "june") return "06"
    if(text === "july") return "07"
    if(text === "august") return "08"
    if(text === "september") return "09" 
    if(text === "october") return "10"
    if(text === "november") return "11"
    if(text === "december") return "12"
}

module.exports = {fileExists,getMonth,getNumberOfMonth}