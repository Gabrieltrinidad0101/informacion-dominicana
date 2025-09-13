import jsonData from "./readXmlFile.js"
import {analyzeJson} from "./analyzeJson.js"
import fs from 'fs'
import { constants } from "../../backend/src/constants.js"
import path from "path"

const concepts = analyzeJson(jsonData)

for (const concept of Object.keys(concepts)){
    fs.mkdir(`../../../datas/worldBank/${concept}`,{},_=> {})
    concepts[concept].forEach((value,description)=>{
        const fileDirrection = path.join(constants.dataWorldBank(concept),`/${description
            .replaceAll(":","-")
            .replaceAll(">","mayor")
        }.json`)
        fs.writeFile(fileDirrection,JSON.stringify(value),_=> {})
    })
}