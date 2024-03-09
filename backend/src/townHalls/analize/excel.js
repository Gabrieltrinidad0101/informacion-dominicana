const XLSX = require('xlsx');
const { isNullEmptyUndefinerNan } = require('../../utils');

/**
 * 
 * @param {*} filePath 
 * @returns any[]
 */
const excelToArrayOfObjects = (filePath) => {
    try {
        // Load the Excel file
        const workbook = XLSX.readFile(filePath);

        const totalData = []
        for(const sheetName of workbook.SheetNames){
            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet);
            totalData.push(...data)
        }
        return totalData;
    } catch (error) {
        console.error('Error:', error);
    }
}

/**
 * 
 * @param {Object<string,string>} headers 
 * @returns String
 */
const getSalaryKey = (headers)=>{
    const headersValue = Object.values(headers)
    let salaryKey = ""
    for (const i in headersValue) {
        const salary = headersValue[i].toString().toLowerCase()
        if(!salary.includes("salario") && !salary.includes("sueldo")) continue
        salaryKey = Object.keys(headers)[i]
    }
    return salaryKey
}

const excelAnalize = ({year,month,filePath})=>{
    const data = excelToArrayOfObjects(filePath)
    let employees = 0
    let findSalary = false
    let salaryKey = ""
    const payroll = data.reduce((a,b)=> {
        if(!findSalary){
            salaryKey = getSalaryKey(b) 
            findSalary = !isNullEmptyUndefinerNan(salaryKey)  
            if(!findSalary) return 0 
        }
        if(isNullEmptyUndefinerNan(b[salaryKey]) || typeof b[salaryKey] === "string") return a
        ++employees
        return a + b[salaryKey]
    },0)

    if(!salaryKey) console.log(filePath)

    return [{
        value: payroll,
        time: `${year}-${month}-01`
    },{
        value: employees,
        time: `${year}-${month}-01`
    }]
}

console.log(excelAnalize({
    year: 2023,
    month: 7,
    filePath: "/home/gabriel/Desktop/Javascript/informacion-dominicana/dataPreprocessing/townHalls/Jarabacoa/preData/2022/june.xlsx"
}))

module.exports = {
    excelAnalize
}