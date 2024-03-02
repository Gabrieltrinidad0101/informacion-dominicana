const fs = require("fs").promises
const path = require("path")
const { constants } = require("../constants")
const { excelAnalize } = require("./excel")
const {generalAnalize} = require("./general")
const { monthsOrdes, getNumberOfMonth } = require("../../utils")

/**
 * 
 * @param {string} dataText 
 * @returns 
 */

const analize = async () => {
    const townHallsPath = constants.townHalls()
    const townHalls = await fs.readdir(townHallsPath)
    for (const townHall of townHalls) {
        if (path.extname(townHall) !== "") continue
        const townHallPath = constants.preData(townHall)
        const years = await fs.readdir(townHallPath)
        for (const year of years) {
            const payrollByYear = []
            const payrolls = monthsOrdes(await fs.readdir(path.join(townHallPath,year)))
            for(const payroll of payrolls){
                const filePath = path.join(townHallPath,year,payroll)
                const fileType = path.extname(filePath)
                const month = getNumberOfMonth(path.basename(filePath))
                if(fileType == ".xlsx"){
                    const payrollData = await excelAnalize({year,month,filePath})
                    payrollByYear.push(payrollData)
                    continue
                }
                const dataText = await fs.readFile(filePath, 'utf8');
                payrollByYear.push(generalAnalize({year,month,dataText}))
            }
            console.log(payrollByYear)
        }
    }
}

module.exports = { analize }