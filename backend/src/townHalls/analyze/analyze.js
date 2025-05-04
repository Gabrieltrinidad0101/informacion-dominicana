import { constants } from "../../constants.js"
import { forData } from "../../utils.js"
import fs from 'fs'

const formatJSON = (object) => {
    return Object.keys(object)
      .sort((a, b) => {
        // Convert each key to a Date and handle invalid keys (undefined, null, or invalid date)
        const dateA = new Date(a);
        const dateB = new Date(b);
  
        // Handle invalid dates by treating them as the largest or smallest value
        if (isNaN(dateA)) return 1; // Treat invalid date as the latest (move to the end)
        if (isNaN(dateB)) return -1; // Treat invalid date as the latest (move to the end)
  
        return dateA - dateB; // Compare valid dates
      })
      .filter(key => key !== "undefined")  // Filter out "undefined" keys
      .map(key => ({ time: key, value: object[key] })); // Map to desired format
  }
  

export const analyze = async ()=>{
    const payroll = {}
    const employeersM = {}
    const employeersF = {}
    const employeersTotal = {}
    const positionBySalary = {}
    await forData(({year,monthInt,data: data_})=>{
        const data = JSON.parse(data_)
        data.forEach(employeer => {
            employeersM[employeer.date] ??= 0
            employeersF[employeer.date] ??= 0
            employeersTotal[employeer.date] ??= 0
            payroll[employeer.date] ??= 0
            positionBySalary[employeer.date] ??= {}
            positionBySalary[employeer.date][employeer.position] ??= []
            if(employeer.sex === "M") employeersM[employeer.date] += 1
            else if(employeer.sex === "F") employeersF[employeer.date] += 1
            employeersTotal[employeer.date] += 1
            const income = parseFloat(employeer.income?.replaceAll(',',''))
            payroll[employeer.date] += !Object.is(parseFloat(income),NaN) ? parseFloat(income) : 0
            if(employeer.date === "2018-12-31"){
                console.log(employeer.income," ",employeer.page)
            }
            positionBySalary[employeer.date][employeer.position].push({name: employeer.name, income: income || 'N/A'})
        });
    })
    fs.writeFileSync(constants.datasTownHalls("Jarabacoa","Nomina.json"),JSON.stringify(formatJSON(payroll)))
    fs.writeFileSync(constants.datasTownHalls("Jarabacoa","Cantidad Total de Empleados Masculinos.json"),JSON.stringify(formatJSON(employeersM)))
    fs.writeFileSync(constants.datasTownHalls("Jarabacoa","Cantidad Total de Empleados Femeninos.json"),JSON.stringify(formatJSON(employeersF)))
    fs.writeFileSync(constants.datasTownHalls("Jarabacoa","Cantidad Total de Empleados.json"),JSON.stringify(formatJSON(employeersTotal)))
}