import { base } from "./base.js"

export const santoDomingoEsteAnalyze = async (townHallName,townHallPath)=>{
  await base({
    townHallName,
    townHallPath,
    month: "Mes",
    salary: "Sueldo",
    year: "Año",
    delimiter: ";"
  })
}