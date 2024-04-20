import { getNumberOfMonthEs } from '../../utils.js';
import { base } from './base.js';

export const santiagoDeLosCaballerosAnalyze = async (townHallName,townHallPath)=>{
  await base({
    townHallName,
    townHallPath,
    month: "mes",
    salary: "sueldo",
    year: "per",
    delimiter: ",",
    monthCallBack: (payroll,month)=>{
        if(payroll[month] == "REGALIA" || payroll["neto"] == "REGALIA") return 10
        const monthIsInNeto = getNumberOfMonthEs(payroll["neto"])
        if(monthIsInNeto) return monthIsInNeto
        return getNumberOfMonthEs(payroll[month])
    },
    yearCallBack: (payroll,month,year)=>{
      if(getNumberOfMonthEs(payroll["neto"])) return payroll[month]
      if(payroll[month] == "REGALIA") return payroll[year]
      const yearToReturn =  getNumberOfMonthEs(payroll[month]) ? payroll[year] : payroll[month]
      if(yearToReturn == "REGALIA"){
        console.log(payroll)
      }
      return yearToReturn
    }
  })
}