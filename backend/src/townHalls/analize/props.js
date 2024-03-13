const payrollProp = (text) => `
Analiza cuidadosamente el siguiente texto. 
Extrae los nombres, cédulas y salarios con el formato: Pedro 4029999999999 1000. 
No agregues texto adicional, solo el resultado.


${text}`


module.exports = {payrollProp}