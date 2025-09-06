import fs from 'fs';
import { groupLinesOcrSpace } from '../../src/groupLineOcr.js';

const image = 'image_2020_11'
const rawData = JSON.parse(fs.readFileSync(`./${image}.json`).toString());


const result = groupLinesOcrSpace(rawData);

console.log(JSON.stringify(result.lines))
