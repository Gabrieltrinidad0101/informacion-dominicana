import fs from 'fs';

const image = 'image_90deg_2'
const rawData = JSON.parse(fs.readFileSync(`./${image}.json`).toString());

function detectDominantAngle(rawData) {
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
  if (textDirrection > 0 && textRotationBottom > 0) {
    return 0
  }
  if (textDirrection < 0 && textRotationBottom > 0) {
    return 90
  }
  if (textDirrection > 0 && textRotationBottom < 0) {
    return 180
  }
  if (textDirrection < 0 && textRotationBottom < 0) {
    return 270
  }
}

const getLinePosition = (word) => {
  const linesPosition = []
  const linePosition = { xMin: Infinity, yMin: Infinity, yMax: -Infinity, xMax: -Infinity }
  const line = word.map(w => {
    linePosition.xMin = Math.min(linePosition.xMin, w.x)
    linePosition.yMin = Math.min(linePosition.yMin, w.y)
    linePosition.yMax = Math.max(linePosition.yMax, w.y + w.height)
    linePosition.xMax = Math.max(linePosition.xMax, w.x + w.width)
    return w.text
  }).join(' ')
  console.log({
    text: line,
    x: linePosition.xMin,
    y: linePosition.yMin,
    width: linePosition.xMax - linePosition.xMin,
    height: linePosition.yMax - linePosition.yMin,
  },"  ",word)
  linesPosition.push({
    text: line,
    x: linePosition.xMin,
    y: linePosition.yMin,
    width: linePosition.xMax - linePosition.xMin,
    height: linePosition.yMax - linePosition.yMin,
  })
  return line;
};
function rotateWord(word, angle, W, H) {
  const { Left: x, Top: y, Width: w, Height: h } = word;
  if (angle === 0) return { x, y };
  if (angle === 90) return { x: y, y: W - x - w };
  if (angle === 180) return { x: W - x - w, y: H - y - h };
  if (angle === 270) return { x: H - y - h, y: x };
  throw new Error('Invalid angle');
}

function groupLinesWithAngle(json, angle,w,h) {
  const tolerance = 5;
  const rotatedWords = [];

  for (const line of json) {
    for (const word of line.Words) {
      const { x, y } = rotateWord(word, angle,w,h);
      rotatedWords.push({ text: word.WordText, x, y, width: word.Width, height: word.Height });
    }
  }

  rotatedWords.sort((a, b) => a.y - b.y);
  const lines = [];

  for (const word of rotatedWords) {
    let found = false;
    for (const line of lines) {
      if (Math.abs(line.y - word.y) <= tolerance) {
        line.words.push(word);
        found = true;
        break;
      }
    }
    if (!found) {
      lines.push({ y: word.y, words: [word] });
    }
  }

  for (const line of lines) {
    line.words.sort((a, b) => a.x - b.x);
  }

  lines.map(line => getLinePosition(line.words))

  return {
    angle,
    lines: lines.map(line => line.words.map(w => w.text).join(' '))
  };
}


// --------- MAIN ----------
const angle = detectDominantAngle(rawData);
const result = groupLinesWithAngle(rawData, angle,2000,2000);

console.log('Ángulo dominante:', angle)
console.log('Líneas:', result.lines)