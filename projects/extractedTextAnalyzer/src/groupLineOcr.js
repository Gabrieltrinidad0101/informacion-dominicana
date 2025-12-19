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

function rotateWord(word, angle, W, H) {
  const { Left: x, Top: y, Width: w, Height: h } = word;
  if (angle === 0) return { x, y };
  if (angle === 90) return { x: y, y: W - x - w };
  if (angle === 180) return { x: W - x - w, y: H - y - h };
  if (angle === 270) return { x: H - y - h, y: x };
  throw new Error('Invalid angle');
}

function groupLinesWithAngle(json, angle, imageWidth, imageHeight) {
  const rotatedWords = [];

  for (const line of json) {
    for (const word of line.Words) {
      const { x, y } = rotateWord(word, angle, imageWidth, imageHeight);
      rotatedWords.push({ text: word.WordText, x, y, width: word.Width, height: word.Height });
    }
  }

  return { lines: rotatedWords, angle };
}

export const groupLinesOcrSpace = (rawData) => {
  const angle = detectDominantAngle(rawData);
  return groupLinesWithAngle(rawData, angle, 2000, 2000);
}