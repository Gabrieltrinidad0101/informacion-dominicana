import csv from 'csvtojson';
import fs from 'fs/promises';
import path from 'path';
import { forEachFolder, getNumberOfMonthEs } from '../../utils.js';
import { constants } from '../../constants.js';

export const base = async ({ delimiter, year, salary, month,townHallName, townHallPath,monthCallBack }) => {
  const payrolls = {}
  const employees = {}
  await forEachFolder(townHallPath, async (_, payrollPath) => {
    const payrollsData = await csv({ delimiter: delimiter }).fromFile(payrollPath)
    payrollsData.forEach(payroll => {
      if(!payroll[month]) return
      const monthName = monthCallBack ? monthCallBack(payroll[month]) : payroll[month]
      const date = `${payroll[year]}-${getNumberOfMonthEs(monthName)}-01`
      if (!employees[date]) employees[date] = { value: 0 }
      if (!payrolls[date]) payrolls[date] = { value: 0 }
      employees[date] = { time: date, value: employees[date].value + 1 }
      const salaryValue = parseInt(payroll[salary].replace(/(((,|\.)00)$|,)/,""))
      payrolls[date] = { time: date, value: salaryValue + payrolls[date].value }
    })
  })
  const dataTownHalls = constants.datasTownHalls(townHallName)
  await fs.writeFile(path.join(dataTownHalls, "employees.json"), JSON.stringify(Object.values(employees)))
  await fs.writeFile(path.join(dataTownHalls, "payrolls.json"), JSON.stringify(Object.values(payrolls)))
}