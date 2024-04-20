import csv from 'csvtojson';
import fs from 'fs/promises';
import path from 'path';
import { forEachFolder, getNumberOfMonthEs } from '../../utils.js';
import { constants } from '../../constants.js';

export const base = async ({ delimiter, year, salary, month,townHallName, townHallPath,monthCallBack,yearCallBack }) => {
  const payrolls = {}
  const employees = {}
  await forEachFolder(townHallPath, async (_, payrollPath) => {
    const payrollsData = await csv({ delimiter: delimiter }).fromFile(payrollPath)
    payrollsData.forEach(payroll => {
      if(!payroll[month]) return
      const monthName = monthCallBack ? monthCallBack(payroll,month,year) : getNumberOfMonthEs(payroll[month])
      const yearNumber = yearCallBack ? yearCallBack(payroll,month,year) : payroll[year]
      if(yearNumber == undefined || monthName == undefined){
        console.log(yearNumber == undefined ? "year" : "month", payroll)
      }
      const date = `${yearNumber}-${monthName}-01`
      if (!employees[date]) employees[date] = { value: 0 }
      if (!payrolls[date]) payrolls[date] = { value: 0 }
      employees[date] = { time: date, value: employees[date].value + 1 }
      const salaryValue = parseInt(payroll[salary].replace(/(((,|\.)00)$|,)/,""))
      payrolls[date] = { time: date, value: salaryValue + payrolls[date].value }
    })
  })
  const dataTownHalls = constants.datasTownHalls(townHallName)
  const employeeSort = Object.values(employees).sort((a,b)=> 
    new Date(new Date(a.time).getTime() - new Date(b.time).getTime()) 
  )
  const payrollsSort = Object.values(payrolls).sort((a,b)=> 
    new Date(new Date(a.time).getTime() - new Date(b.time).getTime()) 
  )
  await fs.writeFile(path.join(dataTownHalls, "Empleados.json"), JSON.stringify(employeeSort))
  await fs.writeFile(path.join(dataTownHalls, "Nominas.json"), JSON.stringify(payrollsSort))
}