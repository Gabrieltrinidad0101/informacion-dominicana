import { constants } from '../../constants.js';
import { getNumberOfMonth, isNullEmptyUndefinerNan } from '../../utils.js';
import {promises as fs} from "fs"
const numbers = new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"])
const letters = new Set(["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "a", "s", "d", "f", "g", "h", "j", "k", "l", "ñ", "z", "x", "c", "v", "b", "n", "m", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "A", "S", "D", "F", "G", "H", "J", "K", "L", "Ñ", "Z", "X", "C", "V", "B", "N", "M"])

/**
 * 
 * @param {string} line 
 * @returns 
 */
const getData = (line) => {
    let name = ""
    let findNumber = false
    let findAletter = false

    const regex = /(?:\d{1,3},)?\d{1,3}(\.\d{2}|,\d{2})/g;
    let salary = line.match(regex);
    if (!salary || salary?.length <= 0) {
        
        salary = line.match(/\d+-?\d+-?\d+\s\d+-?\d+-?\d+\s(\d+(\.,)?\d+)/g)
        if (!salary || salary?.length <= 0) {
            // RDS285800
            salary = line.match(/RDS\d+/g)
            if (!salary || salary?.length <= 0) {
                return {}
            }
            salary = [salary[0].split("RDS")[1].slice(0,-2)]
            appendText("Thrid: ",salary,"   ",line)
        }else {
            salary = [salary[0].split(" ").at(-1).slice(0,-2)]
            appendText("Second: ",salary,"   ",line)
        }
    }

    // (radom text) (some number) (employe name)
    // (some number) (employe name)
    for (let i = 0; i < line.length; i++) {
        if (name != "" && numbers.has(line[i])) break
        if (findNumber && letters.has(line[i])) findAletter = true
        if (numbers.has(line[i])) findNumber = true
        if (findNumber && findAletter) name += line[i]
    }

    const position = getPosition(line)
    if (position && !name) {
        // (random text) (employe name) (rnc)
        const indexOfFirstSpace = line.indexOf(" ")
        const indexOfFirstNumber = line.indexOf("0")
        name = line.slice(indexOfFirstSpace, indexOfFirstNumber)
    }
    return { name, position, salary: parseInt(salary[0].replace(",", "")) }
}

const getPosition = (line) => {
    try {
        let positionName = ""
        for (let i = line.length; i > 0; i--) {
            if (numbers.has(line[i])) return positionName.split('').reverse().join('').trim();
            positionName += line[i]
        }
    } catch {
        console.log(line)
    }
}


const appendText = (text)=>{
    fs.appendFile(constants.garbageText,text)
}

export const generalAnalyze = ({payrollName,year,month,dataText})=>{
    const lines = dataText.split("\n")
    let payroll = 0
    let employee = 0
    lines.forEach(line => {
        if(line == "\n"  || isNullEmptyUndefinerNan(line)){
            return
        }
        const data = getData(line)

        if (isNullEmptyUndefinerNan(data.name,data.position,data.salary)){
            appendText(`year: ${year} payroll: ${payrollName} line: ${line}`)
            return
        }
        payroll += data.salary
        ++employee
    })

    return [
        {time: `${year}-${month}-01`,value: payroll},
        {time: `${year}-${month}-01`,value: employee}
    ]
}

