const { constants } = require("../constants")
const { excelAnalize } = require("./excel")
const {generalAnalize} = require("./general")

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
            const payrolls = monthsOrdes(await fs.readdir(year))
            for(const payroll of payrolls){
                const filePath = path.join(townHallPath,year,payroll)
                const fileType = path.extname(filePath)
                if(fileType == ".excel"){
                    const payrollData = excelAnalize(filePath)
                    payrollByYear.push(...payrollData)
                    continue
                }
                const dataText = await fs.readFile(filePath, 'utf8');
                generalAnalize(dataText)
            }
        }
    }
}

module.exports = { analize }