import { forPreData } from "../../utils.js"
import axios from "axios";
import fs from "fs"
import { CONSTANTS } from "../../constants.js";

const propt = `Convert text to JSON and return only the JSON, without additional text.
Use that json like exmaple for analizy the text.
{
"name": "Gabriel",
"ID": "050-0023817-9",
"Position": "MUSICIAN",
"Income": "2,645.00",
"SEX": "M",
}
Think step by step, assuming the gender for the name. If you find an inconsistency, try to correct it and only add a comment if you can't.
If you don't find anything after that text, return "".`



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
        console.error("Error calling DeepSeek API:", error.response?.data || error.message);
    }
}


export const analyze = async () => {
    await forPreData(async (data)=>{
        console.log(data.townHallDataPath," ",data.month)
        // if(i === 1) return
        // for(const d of data.split("------- Chunk -------") ){
        //     console.log(`chunk ${i}`)
        //     response +=  await callDeepSeekAPI(d)
        // }
        // i++
    })
}