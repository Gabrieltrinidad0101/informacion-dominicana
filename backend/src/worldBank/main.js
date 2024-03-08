const jsonData = require("./readXmlFile")
const analizeJson = require("./analizeJson")
const fs = require('fs')
const { constants } = require("../constants")
const path = require("path")

const concepts = analizeJson(jsonData)
for (const concept of Object.keys(concepts)){
    fs.mkdir(`../../../datas/worldBank/${concept}`,{},_=> {})
    concepts[concept].forEach((value,description)=>{
        const fileDirrection = path.join(constants.dataWorldBank(concept),`/${description}.json`)
        fs.writeFile(fileDirrection,JSON.stringify(value),_=> {})
    })
}