import fs, { promises as fsPromises } from "fs";
import path from "path";
import { constants } from "./constants.js";
import { getPath } from "./getPath.js";


export const fileExists = (filePath) => {
    try {
        return fs.existsSync(filePath)
    } catch {
        return false
    }
}

/**
 * 
 * @param {string} text 
 */

export const getMonth = (text) => {
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

export const getNumberOfMonth = (text) => {
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

export const getNumberOfMonthEs = (text) => {
    const textloweCase = text.toLowerCase()
    if (textloweCase.includes("enero")) return "01"
    if (textloweCase.includes("febrero") || textloweCase.includes("feb")) return "02"
    if (textloweCase.includes("marzo")) return "03"
    if (textloweCase.includes("abril")) return "04"
    if (textloweCase.includes("mayo")) return "05"
    if (textloweCase.includes("junio")) return "06"
    if (textloweCase.includes("julio")) return "07"
    if (textloweCase.includes("agosto")) return "08"
    if (textloweCase.includes("septiembre")) return "09"
    if (textloweCase.includes("octubre")) return "10"
    if (textloweCase.includes("noviembre") || textloweCase === "11.pdf") return "11"
    if (textloweCase.includes("diciembre")) return "12"
}

/**
 * 
 * @param  {...any[]} values 
 * @returns 
 */

export const isNullEmptyUndefinerNan = (...values) =>
    values.some(value => value === undefined || value === null || Object.is(value, NaN) || value === "")


/**
 * 
 * @param {Array<string>} months 
 */
export const monthsOrdes = (months) => {
    const monthOrder = {
        january: 1,
        february: 2,
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

    const monthsInOrden = Array(12)
    months.forEach(month => {
        const index = monthOrder[path.parse(month).name]
        monthsInOrden[index] = month
    })
    return monthsInOrden.filter(month => !isNullEmptyUndefinerNan(month))
}

export const forEachFolder = async (folder,callBack)=>{
  const townHalls = fs.readdirSync(folder)
  for (const name of townHalls) {
    await callBack(name,getPath(folder,name))
  }
}

export const forPreData = async (callBack) => {
    await forEachFolder(constants.datasTownHalls(),async (townHall,townHallPath)=>{
        await forEachFolder(constants.preData(townHall),async (year)=>{
            await forEachFolder(constants.preData(townHall,year),async (month,monthPath)=>{
                await callBack({
                    data: fs.readFileSync(monthPath).toString(),
                    townHall,
                    month: removeExtension(month),
                    monthInt: getNumberOfMonth(removeExtension(month)),
                    year
                })
            })
        })
    })
}


export const forPayroll = async (callBack) => {
    const townHallsPath = constants.townHalls()
    const townHalls = await fsPromises.readdir(townHallsPath)
    for (const townHall of townHalls) {
        if (path.extname(townHall) !== "") continue
        const townHallPath = constants.images(townHall)
        const years = await fsPromises.readdir(townHallPath)
        for (const year of years) {
            const months = monthsOrdes(await fsPromises.readdir(path.join(townHallPath,year)))
            for(const month of months){
                const payrollPath = constants.images(townHall,year,month)
                const payrolls = await fsPromises.readdir(payrollPath)
                for(const payroll of payrolls){
                    const filePath = path.join(townHallPath,year,month,payroll)
                    await callBack({townHall,year,month,payroll,filePath })
                }
            }
        }
    }
}

export const removeExtension = (filename) => {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) return filename;
    return filename.substring(0, lastDotIndex);
}