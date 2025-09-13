import fs from 'fs';
import { groupLinesOcrSpace } from '../../src/groupLineOcr.js';

const rawData = JSON.parse(fs.readFileSync(`/home/gabriel/Desktop/Javascript/informacion-dominicana/data/Ayuntamiento de Jarabacoa/nomina/extractedText/2020/marzo/5.json`).toString());


const result = groupLinesOcrSpace(rawData);

console.log(JSON.stringify(result.lines))
