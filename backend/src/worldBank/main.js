const jsonData = require("./readXmlFile")
const analizeJson = require("./analizeJson")
const fs = require('fs')
const { constants } = require("../constants")

const concepts = analizeJson(jsonData)
for (const concept of Object.keys(concepts)){
    fs.mkdir(`../processedData/worldBank/${concept}`,{},_=> {})
    concepts[concept].forEach((value,description)=>{
        const fileDirrection = path.JSON(constants.dataWorldBank(concept),`/${description}.json`)
        fs.writeFile(fileDirrection,JSON.stringify(value),_=> {})
    })
}