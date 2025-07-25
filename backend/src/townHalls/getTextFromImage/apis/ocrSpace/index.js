import fs from 'fs';
import {groupLinesOcrSpace} from './groupLine.js';
import { text } from 'stream/consumers';
// read the file /home/gabriel/Desktop/Javascript/informacion-dominicana/dataPreprocessing/townHalls/Jarabacoa/preData/2018/april.json

const filePath = '/home/gabriel/Desktop/Javascript/informacion-dominicana/dataPreprocessing/townHalls/Jarabacoa/preData/2021/april/0_textOverlay.json'

const textOverlay = JSON.parse(fs.readFileSync(filePath).toString())
const data = groupLinesOcrSpace(textOverlay)

console.log(data.lines.map(line => line.text).join('\n'))