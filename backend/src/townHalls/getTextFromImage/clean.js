/**
 * 
 * @param {string} text 
 */
export const clean = (text)=>{
    const lines = text.split("\n")
    let linesWithFilter = ""
    for (const line of lines) {
        if(line.length <= 20) continue
        if (isNullEmptyUndefinerNan(line) || line.includes("Total:")) continue
        linesWithFilter += linesWithFilter
    }
    return linesWithFilter
}
