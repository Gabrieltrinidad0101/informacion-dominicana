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

Processing Instructions:
    Analyze the input text and extract relevant fields (name, document, position, income, sex).
    Infer missing fields when possible (e.g., assume gender based on the name if not explicitly stated).
    Correct inconsistencies (e.g., if "sex" contradicts the name's typical gender, prioritize explicit data).
    Only add a comment if a field cannot be resolved after inference.
    If no usable data is found, return an empty string "".
    Replace any " inside a value with ' (e.g., {name: pe"ppe} → {name: pe'ppe}).
Output Requirements:
    Return strictly valid JSON with no extra text or formatting.
    Omit fields that cannot be extracted or inferred.
    Ensure numeric/date formats match the example (e.g., "2645").


### Key Improvements:  
1. **Clearer Structure**: Separated example, instructions, and output requirements.  
2. **Better Readability**: Used bullet points and bold headers for emphasis.  
3. **More Specific Rules**: Explicitly stated how to handle missing fields, inconsistencies, and edge cases.  
4. **Stricter Output**: Emphasized "no extra text" and valid JSON formatting. 
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

const setPositionToEmployee = (employees, data) => {
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
        if(employee.document) employee.document = encrypt(employee.document)
    })
}

export const ai = async () => {
    let testStop = 0
    await forPreData(async ({ pages, townHall, month, monthInt, year }) => {
        if (testStop > 1) return
        testStop++
        const filePath = constants.townHallData(townHall, year, `${month}.json`)
        if (fileExists(filePath)) return
        const townHallPath = constants.townHallData(townHall, year)
        const pageskeys = Object.keys(pages)
        console.log(`generated ${townHallPath}/${month} - pages: ${pageskeys.length}`)
        let response = []
        for (let page of pageskeys) {
            const text = pages[page].map(data => data.text).join("\n")
            const chuck = await callDeepSeekAPI(text)
            console.log(`   chunk ${page} completed`)
            const employees = formatJson({ chuck, year, monthInt, townHall, chuckText: text, page })
            if (Object.keys(employees).length > 0) {
                setPositionToEmployee(employees, pages[page])
            }
            response = response.concat(employees)
            fs.writeFileSync(filePath, JSON.stringify(response))
        }
    })
}