import { isNullEmptyUndefinerNan } from "../../utils.js"

/**
 * 
 * @param {string} text 
 */
export const clean = (text)=>{
    const lines = text.split("\n")
    let linesWithFilter = ""
    for (const i in lines) {
        const line = lines[i]
        if(line.length <= 66 || isNullEmptyUndefinerNan(line) || line.includes("Empleados") || line.includes("Total")) continue
        const lineWithFilter = line.replace(/[^a-zA-Z0-9"\-\., ]/g, '').trim() + (i === line.length - 1 ? "" : "\n");
        if(lineWithFilter.length <= 66 || isNullEmptyUndefinerNan(lineWithFilter) || lineWithFilter == "\n") continue
        const regex1 = /\d{3}/g;
        const numbers = line.match(regex1);

        const regex2 = /(?:\d{1,3},)?\d{1,3}(\.\d{2}|,\d{2})/g;
        const salary = line.match(regex2);
        if ((!numbers || numbers?.length < 3) && (!salary || salary?.length < 3) ) continue
        linesWithFilter += lineWithFilter
    }

    return linesWithFilter
}
