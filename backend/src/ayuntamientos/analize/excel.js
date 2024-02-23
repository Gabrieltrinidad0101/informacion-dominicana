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
                    rowData[worksheet.getRow(1).getCell(colIndex).value] = cell.value;
                });
                data.push(rowData);
            }
        });
    } catch (error) {
        console.error('Error:', error);
    }

    return data;
}

// Usage
const filePath = 'example.xlsx'; // Path to your Excel file
excelToArrayOfObjects(filePath)
    .then(data => {
        console.log(data); // Array of objects representing Excel data
    });
