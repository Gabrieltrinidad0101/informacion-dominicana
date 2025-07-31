import fs from 'fs';
import path, { dirname,join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class FileManager {
    getFile = (path) => {
        return JSON.parse(fs.readFileSync(path).toString())
    }

    getPath = (...paths) => {
        const path_ = `${__dirname}/../../data/${join(...paths.map(path => path.toString()))}`
        return path_
    }
    
    makePath = (...paths) => {
        const path_ = `${__dirname}/../../data/${join(...paths)}`
        fs.mkdirSync(path_, { recursive: true })
        return path_
    }

    saveFile = (instituction, type,process, year, month, name, data) => {
        const path = this.makePath(instituction, type,process, year, month)
        fs.writeFileSync(`${path}/${name}`, data)
        return `${path}/${name}`
    }

    fileExists = (filePath) => {
        try {
            return fs.existsSync(filePath.replace(/ /g, '\\ '))
        } catch {
            return false
        }
    }
}
