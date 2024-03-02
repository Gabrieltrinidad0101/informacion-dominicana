const ExcelJS = require('exceljs');

/**
 * 
 * @param {*} filePath 
 * @returns any[]
 */
async function excelToArrayOfObjects(filePath) {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        
        const worksheet = workbook.getWorksheet(1); // Assuming the data is in the first worksheet
        
        const headers = [];
        worksheet.getRow(2).eachCell((cell) => {
            headers.push(cell.value.richText[0].text);
        });

        const data = [];
        worksheet.eachRow({ includeEmpty: false, firstRow: 2 }, (row, rowNum) => {
            if(rowNum <= 2) return
            const rowData = {};
            row.eachCell((cell, colNum) => {
                if(cell.value.richText){
                    rowData[headers[colNum - 1]] = cell.value.richText[0].text;
                    return
                }
                rowData[headers[colNum - 1]] = cell.value;
            });
            data.push(rowData);
        });
        return data;
    } catch (error) {
        console.error('Error:', error);
    }

}

const excelAnalize = async ({year,month,filePath})=>{
    const data = await excelToArrayOfObjects(filePath)
    const total = data.reduce((a,b)=> a + b.Salario,0)
    return {
        value: total,
        time: `${year}-${month}-01`
    }
}

module.exports = {
    excelAnalize
}