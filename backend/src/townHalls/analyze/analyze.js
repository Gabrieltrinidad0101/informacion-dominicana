import { constants } from "../../constants.js"
import { forData } from "../../utils.js"
import fs from 'fs'
export const analyze = async ()=>{
    const payroll = {}
    const employersBySex = {}
    const positionBySalary = {}
    await forData(({year,monthInt,data: data_})=>{
        const data = JSON.parse(data_)
        data.forEach(employer => {
            employersBySex[employer.date] ??= {m: 0,f: 0}
            payroll[employer.date] ??= 0
            positionBySalary[employer.date] ??= {}
            positionBySalary[employer.date][employer.Position] ??= []
            if(employer.SEX === "M") employersBySex[employer.date].m += 1
            else if(employer.SEX === "F") employersBySex[employer.date].f += 1
            const income = parseFloat(employer.Income?.replaceAll(',',''))
            payroll[employer.date] += !Object.is(parseFloat(income),NaN) ? parseFloat(income) : 0
            positionBySalary[employer.date][employer.Position].push({name: employer.name, income: income || 'N/A'})
        });
    })
    fs.writeFileSync(constants.datasTownHalls("Jarabacoa","payroll.json"),JSON.stringify(payroll))
    fs.writeFileSync(constants.datasTownHalls("Jarabacoa","employersBySex.json"),JSON.stringify(employersBySex))
    fs.writeFileSync(constants.datasTownHalls("Jarabacoa","positionBySalary.json"),JSON.stringify(positionBySalary))
}