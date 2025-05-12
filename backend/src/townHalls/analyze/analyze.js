import { constants } from "../../constants.js"
import { forData } from "../../utils.js"
import fs from 'fs'

const formatJSON = (object) => {
  return Object.keys(object)
    .sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);

      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;

      return dateA - dateB;
    })
    .filter(key => key !== "undefined")
    .map(key => ({ time: key, value: object[key] }));
}

const setTownHall = (townHall, ...objs) => {
  for (const obj of objs) {
    obj[townHall] ??= {}
  }
}


export const analyze = async () => {
  const payroll = {}
  const employeersM = {}
  const employeersF = {}
  const employeersTotal = {}
  const positionBySalary = {}
  await forData(({ year, monthInt, townHall, data: data_ }) => {
    const data = JSON.parse(data_)
    data.forEach(employeer => {
      setTownHall(townHall, employeersM, employeersF, employeersTotal, payroll, positionBySalary)
      employeersM[townHall][employeer.date] ??= 0
      employeersF[townHall][employeer.date] ??= 0
      employeersTotal[townHall][employeer.date] ??= 0
      payroll[townHall][employeer.date] ??= 0
      positionBySalary[townHall][employeer.date] ??= {}
      positionBySalary[townHall][employeer.date][employeer.position] ??= []
      if (employeer.sex === "M") employeersM[townHall][employeer.date] += 1
      else if (employeer.sex === "F") employeersF[townHall][employeer.date] += 1
      employeersTotal[townHall][employeer.date] += 1
      const income = parseFloat(employeer.income || '0') || 0
      payroll[townHall][employeer.date] += income
      positionBySalary[townHall][employeer.date][employeer.position].push({
        name: employeer.name,
        x: employeer.x,
        y: employeer.y,
        height: employeer.height,
        width: employeer.width,
        income: income || 'N/A',
        page: employeer.page,
        pageAngle: employeer.pageAngle,
      })
    });
  })


  for (const townHall of Object.keys(payroll)) {
    fs.writeFileSync(constants.datasTownHalls(townHall, "Nomina.json"), JSON.stringify(formatJSON(payroll[townHall])))
    fs.writeFileSync(constants.datasTownHalls(townHall, "Cantidad Total de Empleados Masculinos.json"), JSON.stringify(formatJSON(employeersM[townHall])))
    fs.writeFileSync(constants.datasTownHalls(townHall, "Cantidad Total de Empleados Femeninos.json"), JSON.stringify(formatJSON(employeersF[townHall])))
    fs.writeFileSync(constants.datasTownHalls(townHall, "Cantidad Total de Empleados.json"), JSON.stringify(formatJSON(employeersTotal[townHall])))
    for (const date of Object.keys(positionBySalary[townHall])) {
      fs.writeFileSync(constants.datasTownHalls(townHall, `positionBySalary - ${date}.json`), JSON.stringify(positionBySalary[townHall][date]))
    }
  }
}