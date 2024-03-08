const fs = require("fs").promises
const path = require("path")
const { constants } = require("../../constants")
const { excelAnalize } = require("./excel")
const {generalAnalize} = require("./general")
const { monthsOrdes, getNumberOfMonth } = require("../../utils")
const fileLinks = path.join(constants.townHalls(),"pdfLinks.json")
//const links = JSON.parse(await fs.readFile(fileLinks))
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
        let topics = "// NOT EDIT THIS FILE IS AUTO GENERATE\nexport const topics = ["
        for (const year of years) {
            const payrollsByYear = []
            const employeesByYear = []
            const payrolls = monthsOrdes(await fs.readdir(path.join(townHallPath,year)))
            for(const payroll of payrolls){
                const filePath = path.join(townHallPath,year,payroll)
                const fileType = path.extname(filePath)
                const month = getNumberOfMonth(path.parse(payroll).name)
                if(fileType == ".xlsx"){
                    const [payrollData,employeesData] = excelAnalize({year,month,filePath})
                    payrollsByYear.push(payrollData)
                    employeesByYear.push(employeesData)
                    continue
                }
                const dataText = await fs.readFile(filePath, 'utf8');
                const [payrollData,employeesData] = generalAnalize({year,month,dataText})
                payrollsByYear.push(payrollData)
                employeesByYear.push(employeesData)
            }
            const payrollFileName = `${year}-payroll.json`
            const employeesFileName = `${year}-employee.json`
            const dataPathPayroll = path.join(constants.datas(townHall),`${year}-payroll.json`)
            const dataPathEmployee = path.join(constants.datas(townHall),`${year}-employee.json`)
            await fs.writeFile(dataPathPayroll,JSON.stringify(payrollsByYear))
            await fs.writeFile(dataPathEmployee,JSON.stringify(employeesByYear))
            topics += `"${payrollFileName}","${employeesFileName}",`
        }
        //creating the frontend file
        await fs.writeFile(constants.frontendTownHall(townHall),`${topics}]`)
    }
}

module.exports = { analize }