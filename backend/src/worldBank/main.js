import jsonData from "./readXmlFile.js"
import analyzeJson from "./analyzeJson.js"
import fs from 'fs'
import { constants } from "../constants.js"
import path from "path"

const concepts = analyzeJson(jsonData)
for (const concept of Object.keys(concepts)){
    fs.mkdir(`../../../datas/worldBank/${concept}`,{},_=> {})
    concepts[concept].forEach((value,description)=>{
        const fileDirrection = path.join(constants.dataWorldBank(concept),`/${description}.json`)
        fs.writeFile(fileDirrection,JSON.stringify(value),_=> {})
    })
}