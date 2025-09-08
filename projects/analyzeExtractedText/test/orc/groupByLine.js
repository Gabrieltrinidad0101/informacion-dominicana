import fs from 'fs';
import { groupLinesOcrSpace } from '../../src/groupLineOcr.js';

const rawData = JSON.parse(fs.readFileSync(`/home/gabriel-trinidad/Desktop/javascript/informacion-dominicana/data/Ayuntamiento de Jarabacoa/nomina/extractedText/2020/marzo/14.json`).toString());


const result = groupLinesOcrSpace(rawData);

console.log(JSON.stringify(result.lines))
