const { getNumberOfMonth } = require('../../utils');

const fs = require('fs').promises;

const numbers = new Set(["0","1","2","3","4","5","6","7","8","9"])
const letters = new Set(["q","w","e","r","t","y","u","i","o","p","a","s","d","f","g","h","j","k","l","ñ","z","x","c","v","b","n","m","Q","W","E","R","T","Y","U","I","O","P","A","S","D","F","G","H","J","K","L","Ñ","Z","X","C","V","B","N","M"])

/**
 * 
 * @param {string} line 
 * @returns 
 */

// converting the image into text we can fing difference cases
// (radom text) (some number) (employe name)
// (some number) (employe name)
// (random text) (employe name) (rnc)

const getData = (line)=>{
    let name = ""
    let findNumber = false
    let findAletter = false

    const regex = /(?:\d{1,3},)?\d{1,3}\.\d{2}/g;
    const salary = line.match(regex);
    if(!salary || salary?.length <= 0) return {}

    // (radom text) (some number) (employe name)
    // (some number) (employe name)
    for(let i = 0; i < line.length; i++){
        if(name != "" && numbers.has(line[i])) break
        if(findNumber && letters.has(line[i])) findAletter = true
        if(numbers.has(line[i])) findNumber = true
        if(findNumber && findAletter) name += line[i]
    }
    
    const position = getPosition(line)
    if(position && !name){
        // (random text) (employe name) (rnc)
        const indexOfFirstSpace = line.indexOf(" ")
        const indexOfFirstNumber = line.indexOf("0")
        name = line.slice(indexOfFirstSpace,indexOfFirstNumber)
    }
    return {name,position,salary: parseInt(salary[0].replace(",",""))}
}

const getPosition = (line)=>{
    try{
        let positionName = ""
        for(let i = line.length; i > 0; i--){
            if(numbers.has(line[i])) return positionName.split('').reverse().join('').trim();
            positionName += line[i]
        }
    }catch{
        console.log(line)
    }
}

/**
 * 
 * @param {string} dataText 
 * @returns 
 */

const analize = ({year,month,dataText,parse})=>{
    const lines = dataText.split("\n")
    const nomina = []
    
    lines.forEach(line=>{
        if(line.length < 20) return
        if(line === "" || line.includes("Total:") || line.includes("Carnet")) return
        const data = getData(line)
        if(!data.name || !data.position) return
        data.time = `${year}-${getNumberOfMonth(month)}-01`
        nomina.push(parse(data))
    })

    return nomina
}

module.exports = {analize}