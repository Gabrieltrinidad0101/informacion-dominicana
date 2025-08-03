import axios from "axios";

export async function apiLLMClient(content) {
    try {
        const response = await axios.post(
            "https://api.deepseek.com/v1/chat/completions",
            {
                model: "deepseek-chat",
                messages: [
                    { role: "user", content }
                ],
                temperature: 0.7,
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.API_AI_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );
        return response.data?.choices?.[0]?.message?.content.replaceAll('```json','').replaceAll('```','') ?? "";
    } catch (error) {
        console.error("Error calling DeepSeek API:");
        console.log(error)
        return ""
    }
}