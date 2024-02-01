const getConcept = require("./getConcept")

/**
 * 
 * @param {Object} records 
 */
const analizeJson = (records)=>{
    const dataByConcept = {
        social: {}
    } 
    for(const record of records){
        const description = record.field[1]._text
        const time = record.field[2]._text
        const value = record.field[3]._text 
        
        const conceptName = getConcept(description)
        if (!conceptName) continue
        const concept = dataByConcept[conceptName]

        if(concept[description] === undefined) concept[description] = defaultData(description)
        const data = concept[description]
        data.values.push(dataFormat({time,value}))
    }
    
    return dataByConcept
}

const defaultData = (description)=>{
    return {
            description,
            values: [] 
        }
}

const dataFormat = ({time,value})=>{
    return {time: `${time}-01-01`,value: parseInt(value ?? "0")}
}


module.exports = analizeJson