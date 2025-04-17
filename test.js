const propt = `Convert the given text into a JSON format using the example below as a template. Return only the JSON output without any additional explanations or text.  

**Example JSON Structure:**  
\`\`\`json
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


console.log(propt)