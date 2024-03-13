import convert from 'xml-js';
import path from "path"
import fs from 'fs'


const xml  = fs.readFileSync(path.join(__dirname,'./data/API_DOM_DS2_es_xml_v2_6306183.xml'), 'utf8');
const jsonData = convert.xml2js(xml, {compact: true, spaces: 0});

export default jsonData.Root.data.record