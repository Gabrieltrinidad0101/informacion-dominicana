import fs from "fs"
import path from "path";

export const getPath = (...paths) => {
    const pathToReturn = path.join(...paths)
    if (pathToReturn === "") return pathToReturn
    let pathWithoutFile  = pathToReturn
    if (path.extname(pathToReturn) != ""){
        pathWithoutFile = path.dirname(pathToReturn)
    }
    fs.mkdirSync(pathWithoutFile, { recursive: true })
    return pathToReturn
}