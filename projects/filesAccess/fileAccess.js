import fs from 'fs';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const getFile = (path)=>{
    return fs.readFileSync(path).toString()
}

export const makePath = (deparment,type,year,month,name)=>{
    return `${__dirname}/../${deparment}/${type}/${year}/${month}/${name}`
}

export const saveFilePayroll = (deparment,type,year,month,name,data)=>{
    fs.writeFileSync(`${__dirname}/../${deparment}/${type}/${year}/${month}/${name}`,data)
}