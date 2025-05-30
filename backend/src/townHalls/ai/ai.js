import { fileExists, forPreData } from "../../utils.js"
import axios from "axios";
import fs from "fs"
import { constants, CONSTANTS } from "../../constants.js";
import {encrypt} from "./encrypt.js"

const propt = `Convert the given text into a JSON format using the example below as a template. Return only the JSON output without any additional explanations or text.  

**Example JSON Structure:**
[{
    "name": "Gabriel",
    "document": "050-9999999-9",
    "position": "MUSICIAN",
    "income": "2645",
    "sex": "M"
}]

**Special Case Example (Institutional Entry):**
[{
    "name": "SUBVENCION BOMBEROS",
    "position": "BOMBEROS",
    "income": "150000"
}]

Processing Instructions:
    Analyze the input text and extract relevant fields (name, document, position, income, sex).
    For institutional entries (e.g., names containing "SUBVENCION", "SUBSIDIO", or similar terms):
        - Omit \`document\` and \`sex\` fields entirely.
        - Retain \`name\`, \`position\`, and \`income\` if available.
    For individual entries:
        - Infer missing fields (e.g., assume gender based on name if not stated).
        - Correct inconsistencies (prioritize explicit data over inferred).
    Replace any " inside a value with ' (e.g., {name: pe"ppe} → {name: pe'ppe}).
    Only include fields that can be extracted or inferred. Omit all others.

Output Requirements:
    Return strictly valid JSON with no extra text or formatting.
    Ensure numeric/date formats match the examples (e.g., "2645", "150000").
`



async function callDeepSeekAPI(data) {
    try {
        const response = await axios.post(
            "https://api.deepseek.com/v1/chat/completions",
            {
                model: "deepseek-chat",
                messages: [
                    { role: "user", content: `${propt}\n${data}` }
                ],
                temperature: 0.7,
            },
            {
                headers: {
                    "Authorization": `Bearer ${CONSTANTS.ApiAiKey}`,
                    "Content-Type": "application/json"
                }
            }
        );
        return response.data?.choices?.[0]?.message?.content ?? "";
    } catch (error) {
        console.error("Error calling DeepSeek API:");
        console.log(error)
        return ""
    }
}

function getLastDayOfMonth(year, month) {
    const lastDay = new Date(year, month, 0);
    const yyyy = lastDay.getFullYear();
    const mm = String(lastDay.getMonth() + 1).padStart(2, '0');
    const dd = String(lastDay.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}


const formatJson = ({ chuck, year, monthInt, chuckText, townHall, page }) => {
    const jsonString = chuck.replaceAll("`", "").replaceAll("json", "")
    try {
        const employees = [].concat(JSON.parse(jsonString))
        employees.forEach(employee => {
            employee.date = getLastDayOfMonth(year, monthInt)
            employee.page = page
            employee.deparment = townHall
        })
        return employees
    } catch(e) {
        console.log('Error in json format')
        console.log(e)
        const errorPath = constants.townHallData(townHall, year, `error-${monthInt}.txt`)
        const response = { chuck, jsonString, chuckText, page,e: JSON.stringify(e) }
        fs.appendFileSync(errorPath, `${JSON.stringify(response)}\n\n\n`)
        return {}
    }
}

const setPositionToEmployee = (employees, data,angle) => {
    employees.forEach(employee => {
        const lines = data.filter(data => {
            if(!employee.document) {
                return data.text.includes(employee.name)
            }
            return data.text.includes(employee.document)
        })
        if(lines.length > 1 || lines.length <= 0) {
            fs.appendFileSync("test-error.txt", `\n\n\n${JSON.stringify({lines,employee,data})}\n\n\n`)
            return
        }
        employee.x = lines[0].x
        employee.y = lines[0].y 
        employee.width = lines[0].width
        employee.height = lines[0].height
        employee.pageAngle = angle
        if(employee.document) employee.document = encrypt(employee.document)
    })
}

export const ai = async () => {
    await forPreData(async ({ pages, townHall, month, monthInt, year }) => {
        const filePath = constants.townHallData(townHall, year, `${month}.json`)
        if (fileExists(filePath)) return
        const townHallPath = constants.townHallData(townHall, year)
        const pageskeys = Object.keys(pages)
        console.log(`generated ${townHallPath}/${month} - pages: ${pageskeys.length}`)
        let response = []
        for (let page of pageskeys) {
            const text = pages[page].lines.map(data => data.text).join("\n")
            const chuck = await callDeepSeekAPI(text)
            console.log(`   chunk ${page} completed`)
            const employees = formatJson({ chuck, year, monthInt, townHall, chuckText: text, page })
            if (Object.keys(employees).length > 0) {
                setPositionToEmployee(employees, pages[page].lines,pages[page].angle)
            }
            response = response.concat(employees)
            fs.writeFileSync(filePath, JSON.stringify(response))
        }
    })
}