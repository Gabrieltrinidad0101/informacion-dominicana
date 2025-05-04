import vision from '@google-cloud/vision';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new vision.ImageAnnotatorClient({
  keyFilename: path.join(__dirname, 'vision-key.json')
});

function getYMid(boundingBox) {
  const yVals = boundingBox.vertices.map(v => v.y || 0);
  return yVals.reduce((a, b) => a + b, 0) / yVals.length;
}

function groupWordsByLines(words, tolerance = 10) {
  const lines = [];

  for (const word of words) {
    const text = word.symbols.map(s => s.text).join('');
    const y = getYMid(word.boundingBox);

    let added = false;
    for (const line of lines) {
      if (Math.abs(line.y - y) <= tolerance) {
        line.words.push({ text, x: word.boundingBox.vertices[0].x, box: word.boundingBox });
        added = true;
        break;
      }
    }

    if (!added) {
      lines.push({ y, words: [{ text, x: word.boundingBox.vertices[0].x, box: word.boundingBox }] });
    }
  }

  // Sort words within each line by X
  for (const line of lines) {
    line.words.sort((a, b) => a.x - b.x);
  }

  // Sort lines by Y
  lines.sort((a, b) => a.y - b.y);

  return lines;
}

async function detectVisualLines(imagePath) {
  const [result] = await client.documentTextDetection(imagePath);
  fs.writeFileSync('r.json', JSON.stringify(result));
  const annotation = result.fullTextAnnotation;

  if (!annotation) return console.log('No text detected');

  const allWords = [];
  for (const page of annotation.pages) {
    for (const block of page.blocks) {
      for (const paragraph of block.paragraphs) {
        allWords.push(...paragraph.words);
      }
    }
  }

  const lines = groupWordsByLines(allWords);

  for (const line of lines) {
    const lineText = line.words.map(w => w.text).join(' ');
    fs.appendFileSync('output.txt', lineText.trim() + '\n');
    for (const word of line.words) {
      fs.appendFileSync('outputPosition.txt', JSON.stringify({ text: word.text.trim(), position: word.box.vertices }) + '\n');
    }
  }
  console.log('---');
}

detectVisualLines('./src/test/images/image1.png');