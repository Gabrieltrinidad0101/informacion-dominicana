import {promises as fs} from "fs"
import path from "path"
import { constants } from "../../constants.js"
import { excelAnalize } from "./excel.js"
import {generalAnalize} from "./general.js"
import { monthsOrdes, getNumberOfMonth } from "../../utils.js"
import { getDatafixes } from "./fixes.js"
import { aiAnalize } from "./aiAnalize.js"

/**
 * 
 * @param {string} dataText 
 * @returns 
 */

export const analize = async () => {
    const townHallsPath = constants.townHalls()
    const townHalls = await fs.readdir(townHallsPath)
    for (const townHall of townHalls) {
        if (path.extname(townHall) !== "") continue
        const townHallPath = constants.preData(townHall)
        const years = await fs.readdir(townHallPath)
        let topics = "// NOT EDIT THIS FILE IS AUTO GENERATE\nexport const topics = ["
        const payrollsByYear = []
        const employeesByYear = []
        for (const year of years) {
            const payrolls = monthsOrdes(await fs.readdir(path.join(townHallPath,year)))
            for(const payroll of payrolls){
                const hasFix = getDatafixes({year,month: payroll})
                if(hasFix){
                    payrollsByYear.push(hasFix.payroll)
                    employeesByYear.push(hasFix.employee)
                    continue
                }
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
                const result = await aiAnalize(dataText)

                console.log(result)
                await new Promise(res=>setTimeout(res,20000))
            }
            const payrollFileName = `${year}-payroll.json`
            const employeesFileName = `${year}-employee.json`
            topics += `"${payrollFileName}","${employeesFileName}",`
        }
        const dataPathPayroll = path.join(constants.datasTownHalls(townHall),`payrolls.json`)
        const dataPathEmployee = path.join(constants.datasTownHalls(townHall),`employees.json`)
        await fs.writeFile(dataPathPayroll,JSON.stringify(payrollsByYear))
        await fs.writeFile(dataPathEmployee,JSON.stringify(employeesByYear))
    }
}