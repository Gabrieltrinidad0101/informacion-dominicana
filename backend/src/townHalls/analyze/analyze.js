import { constants } from "../../constants.js"
import { forData } from "../../utils.js"
import fs from 'fs'

const formatJSON = (object)=>{
    const array = []
    Object.keys(object).sort((a, b) => new Date(a) - new Date(b)).forEach(key => {
        if(key === "undefined") return
        array.push({time: key, value: object[key]})
    })
    return array
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
            positionBySalary[employeer.date][employeer.Position] ??= []
            if(employeer.SEX === "M") employeersM[employeer.date] += 1
            else if(employeer.SEX === "F") employeersF[employeer.date] += 1
            employeersTotal[employeer.date] += 1
            const income = parseFloat(employeer.Income?.replaceAll(',',''))
            payroll[employeer.date] += !Object.is(parseFloat(income),NaN) ? parseFloat(income) : 0
            positionBySalary[employeer.date][employeer.Position].push({name: employeer.name, income: income || 'N/A'})
        });
    })
    fs.writeFileSync(constants.datasTownHalls("Jarabacoa","Nomina.json"),JSON.stringify(formatJSON(payroll)))
    fs.writeFileSync(constants.datasTownHalls("Jarabacoa","Cantidad Total de Empleados Masculinos.json"),JSON.stringify(formatJSON(employeersM)))
    fs.writeFileSync(constants.datasTownHalls("Jarabacoa","Cantidad Total de Empleados Femeninos.json"),JSON.stringify(formatJSON(employeersF)))
    fs.writeFileSync(constants.datasTownHalls("Jarabacoa","Cantidad Total de Empleados.json"),JSON.stringify(formatJSON(employeersTotal)))
}