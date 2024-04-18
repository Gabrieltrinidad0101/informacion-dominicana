import { base } from './base.js';

export const santiagoDeLosCaballerosAnalyze = async (townHallName,townHallPath)=>{
  await base({
    townHallName,
    townHallPath,
    month: "mes",
    salary: "sueldo",
    year: "per",
    delimiter: ",",
    monthCallBack: month=>{
        if(month == "REGALIA") return "OCTUBRE"
        return month
    }
  })
}