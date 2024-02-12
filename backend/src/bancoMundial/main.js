const jsonData = require("./readXmlFile")
const analizeJson = require("./analizeJson")
const fs = require('fs')

const concepts = analizeJson(jsonData)
for (const concept of Object.keys(concepts)){
    fs.mkdir(`../processedData/bancoMundial/${concept}`,{},_=> {})
    concepts[concept].forEach((value,description)=>{
        const fileDirrection = `../processedData/bancoMundial/${concept}/${description}.json`
        fs.writeFile(fileDirrection,JSON.stringify(value),_=> {})
    })
}