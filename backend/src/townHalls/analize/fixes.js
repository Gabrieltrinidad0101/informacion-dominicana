const getDatafixes = ({year,month})=>{
    if(year === "2018" && month === "december.txt"){
        return {
        payroll: {
            time: `2018-12-01`,
            value: 2965362
        },
        employee: {
            time: `2018-12-01`,
            value: 284
        }}
    }

    if(year === "2020" && month === "june.txt"){
        return {
        payroll: {
            time: `2020-06-01`,
            value: 2664532
        },
        employee: {
            time: `2020-06-01`,
            value: 340
        }}
    }
}

module.exports = {getDatafixes}