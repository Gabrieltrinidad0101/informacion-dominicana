import { fileExists, forPreData } from "../../utils.js"
import axios from "axios";
import fs from "fs"
import { constants, CONSTANTS } from "../../constants.js";

const propt = `Convert the given text into a JSON format using the example below as a template. Return only the JSON output without any additional explanations or text.  

**Example JSON Structure:**
[{
    "name": "Gabriel",
    "document": "050-0023817-9",
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


const formatJson = ({chuck,year,monthInt,chuckText,townHall,index})=>{
    const jsonString = chuck.replaceAll("`","").replaceAll("json","")
    try {
        const employers = [].concat(JSON.parse(jsonString))
        employers.forEach(employer=> {
            employer.date = getLastDayOfMonth(year,monthInt)
            employer.page = index
            employer.id
        })
        return employers
    }catch {
        console.log('Error in json format') 
        const errorPath = constants.townHallData(townHall,year,`error-${monthInt}.txt`)
        const response = {chuck,jsonString,chuckText,index}
        fs.appendFileSync(errorPath,JSON.stringify(response))
        return {}
    }
}

export const ai = async () => {
    let testStop = 0
    await forPreData(async ({data,townHall,month,monthInt,year})=>{
        if(testStop > 20) return
        const filePath = constants.townHallData(townHall,year,`${month}.json`)
        if(fileExists(filePath)) return
        const townHallPath = constants.townHallData(townHall,year)
        const chucks = data.split("------- Chunk -------")
        console.log(`generated ${townHallPath}/${month} - Chunks: ${chucks.length}`)
        let response = []
        for(let i in chucks){
            const chuck = await callDeepSeekAPI(chucks[i])
            console.log(`   chunk ${++i} completed`)
            const json = formatJson({chuck,year,monthInt,townHall,chuckText: chucks[i],index: i})
            if(Object.keys(json).length == 0) continue
            response = response.concat(json)
            fs.writeFileSync(filePath,JSON.stringify(response))
        }
        testStop++
    })
}