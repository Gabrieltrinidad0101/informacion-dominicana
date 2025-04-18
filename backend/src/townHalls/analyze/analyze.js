import { fileExists, forPreData } from "../../utils.js"
import axios from "axios";
import fs from "fs"
import { constants, CONSTANTS } from "../../constants.js";

const propt = `Convert the given text into a JSON format using the example below as a template. Return only the JSON output without any additional explanations or text.  

**Example JSON Structure:**  
{
    "name": "Gabriel",
    "ID": "050-0023817-9",
    "Position": "MUSICIAN",
    "Income": "2,645.00",
    "SEX": "M"
}

Processing Instructions:
    Analyze the input text and extract relevant fields (name, ID, position, income, sex).
    Infer missing fields when possible (e.g., assume gender based on the name if not explicitly stated).
    Correct inconsistencies (e.g., if "SEX" contradicts the name's typical gender, prioritize explicit data).
    Only add a comment if a field cannot be resolved after inference.
    If no usable data is found, return an empty string "".
Output Requirements:
    Return strictly valid JSON with no extra text or formatting.
    Omit fields that cannot be extracted or inferred.
    Ensure numeric/date formats match the example (e.g., "2,645.00").


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


const formatJson = ({chuck,year,monthInt})=>{
    const jsonString = chuck.replaceAll("`","").replaceAll("json","")
    try {
        const employers = JSON.parse(jsonString)
        employers.forEach(employer=> employer.date = getLastDayOfMonth(year,monthInt))
        return JSON.stringify(employers)
    }catch {
        return chuck
    }
    
}

export const analyze = async () => {
    let testStop = 1
    await forPreData(async ({data,townHall,month,monthInt,year})=>{
        if(testStop > 2) return
        const filePath = constants.townHallData(townHall,year,`${month}.json`)
        if(fileExists(filePath)) return
        const townHallPath = constants.townHallData(townHall,year)
        const chucks = data.split("------- Chunk -------")
        console.log(`generated ${townHallPath}/${month} - Chunks: ${chucks.length}`)
        for(let i in chucks){
            const chuck = await callDeepSeekAPI(chucks[i])
            console.log(`   chunk ${i++} completed`)
            fs.appendFileSync(filePath,formatJson({chuck,year,monthInt}))
        }
        testStop++
    })
}