import fs from 'fs';
import { dirname,join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class FileManager {
    getFile = (path) => {
        return fs.readFileSync(path).toString()
    }

    makePath = (...paths) => {
        const path_ = `${__dirname}/../../data/${join(...paths)}`
        fs.mkdirSync(path_, { recursive: true })
        return path_
    }

    saveFile = (instituction, type, year, month, name, data) => {
        const path = this.makePath(instituction, type, year, month)
        fs.writeFileSync(`${path}/${name}`, data)
    }

    fileExists = (filePath) => {
        try {
            return fs.existsSync(filePath)
        } catch {
            return false
        }
    }
}
