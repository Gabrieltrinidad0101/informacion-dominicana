import jsonData from "./readXmlFile"
import analizeJson from "./analizeJson"
import fs from 'fs'
import { constants } from "../constants"
import path from "path"

const concepts = analizeJson(jsonData)
for (const concept of Object.keys(concepts)){
    fs.mkdir(`../../../datas/worldBank/${concept}`,{},_=> {})
    concepts[concept].forEach((value,description)=>{
        const fileDirrection = path.join(constants.dataWorldBank(concept),`/${description}.json`)
        fs.writeFile(fileDirrection,JSON.stringify(value),_=> {})
    })
}