import fs from 'fs';

const image = 'image_0deg_2'
const rawData = JSON.parse(fs.readFileSync(`./${image}.json`).toString());

const allWords = [];
for (const block of rawData) {
    for (const word of block.Words) {
        allWords.push(word);
    }
}

function rotation(rawData) {
    let textDirrection = 0;
    let textRotationBottom = 0;
    for (const { Words: words } of rawData) {
        if (words.length < 2) {
            continue
        };
        const width = words.reduce((acc, current) => current.Width + acc, 0);
        const height = words.reduce((acc, current) => current.Height + acc, 0);

        let left = 0;
        for (let index = 0; index < words.length - 1; index += 2) {
            left += words[index + 1].Left - words[index].Left;
        }
        let top = 0;
        for (let index = 0; index < words.length - 1; index += 2) {
            top += words[index].Top - words[index + 1].Top;
        }
        textDirrection += width > height ? 1 : -1;
        textRotationBottom += left > top ? 1 : -1;
    }
    if(textDirrection > 0 && textRotationBottom > 0){
        return 0
    }
    if(textDirrection < 0 && textRotationBottom > 0){
        return 90
    }
    if(textDirrection > 0 && textRotationBottom < 0){
        return 180
    }
    if(textDirrection < 0 && textRotationBottom < 0){
        return 270
    }
}

// 0 left true bottom true
// 90 left false bottom true
// 180 left true bottom false
// 270 left false bottom false
console.log(rotation(rawData))