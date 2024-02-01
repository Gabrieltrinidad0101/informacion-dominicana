const jsonData = require("./readXmlFile")
const analizeJson = require("./analizeJson")
const fs = require('fs')

const concepts = analizeJson(jsonData)
for (const concept of Object.keys(concepts)){
    Object.values(concepts[concept]).forEach((data,index)=>{
        const fileDirrection = `../processedData/bancoMundial/${concept}/${index}.json`
        fs.writeFile(fileDirrection,JSON.stringify(data),()=> {})
    })
}