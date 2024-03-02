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

const excelAnalize = ({year,month,filePath})=>{
    const data = excelToArrayOfObjects(filePath)
    let employees = 0
    const payroll = data.reduce((a,b)=> {
        if(isNullEmptyUndefinerNan(b["__EMPTY_3"]) || typeof b["__EMPTY_3"] === "string") return a
        ++employees
        return a + b["__EMPTY_3"]
    },0)

    return [{
        value: payroll,
        time: `${year}-${month}-01`
    },{
        value: employees,
        time: `${year}-${month}-01`
    }]
}

module.exports = {
    excelAnalize
}