const ExcelJS = require('exceljs');

async function excelToArrayOfObjects(filePath) {
    const workbook = new ExcelJS.Workbook();
    const data = [];

    try {
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(1); // Assuming data is in the first worksheet

        worksheet.eachRow((row, rowIndex) => {
            if (rowIndex !== 1) { // Skip header row
                const rowData = {};
                row.eachCell((cell, colIndex) => {
                    rowData[worksheet.getRow(2).getCell(colIndex).value] = cell.value;
                });
                data.push(rowData);
            }   
        });
    } catch (error) {
        console.error('Error:', error);
    }

    return data;
}

const excelAnalize = async ({year,month,filePath})=>{
    const data = await excelToArrayOfObjects(filePath)
    const nomina = []
    for(let i = 1; i < data.length; i++){
        nomina.push({
            value: data[i].Sueldo,
            time: `${year}-${month}-01`
        })
    }
    return nomina
}

module.exports = {
    excelAnalize
}