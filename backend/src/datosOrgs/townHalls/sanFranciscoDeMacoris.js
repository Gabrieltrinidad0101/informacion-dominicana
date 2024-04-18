import { base } from './base.js';

export const sanFranciscoDeMacorisAnalyze = async (townHallName,townHallPath)=>{
  await base({
    townHallName,
    townHallPath,
    month: "mes",
    salary: "Total Bruto",
    year: "año",
    delimiter: ","
  })
}