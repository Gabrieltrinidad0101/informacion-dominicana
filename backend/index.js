import { GoogleGenerativeAI } from '@google/generative-ai';
import  fs from 'fs';

async function main() {
  const apiKey = 'AIzaSyD92KU5HFavOuziCF_4y11xh1PiAIfWIG8';
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const imagePath = '/home/gabriel/Desktop/Javascript/informacion-dominicana/dataPreprocessing/townHalls/Moca/images/2016/april/jarabacoaTownHall.1.jpg';
  const imageMimeType = 'image/jpeg';
  const imageData = fs.readFileSync(imagePath).toString('base64');

  const contents = [
    {
      parts: [
        {
          inlineData: {
            mimeType: imageMimeType,
            data: imageData,
          },
        },
        { text: `Convert the given image into a JSON format using the example below as a template. Return only the JSON output without any additional explanations or text.

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
    Ensure numeric/date formats match the examples (e.g., "2645", "150000").` },
      ],
    },
  ];


  try {
    const result = await model.generateContent({
      contents: contents,
    });
    const response = await result.response;
    if (response.candidates && response.candidates.length > 0 && response.candidates[0].content.parts && response.candidates[0].content.parts.length > 0) {
      console.log(response.candidates[0].content.parts[0].text);
    } else {
      console.log('No response text found.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main();