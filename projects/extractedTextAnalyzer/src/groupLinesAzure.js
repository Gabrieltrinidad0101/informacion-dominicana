function rotatePointBackwards(xp, yp, anguloGrados, cx = 1000, cy = 1000) {
    const theta = (Math.PI / 180) * anguloGrados;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
  
    const xRel = xp - cx;
    const yRel = yp - cy;
  
    const xRot = xRel * cos + yRel * sin;
    const yRot = -xRel * sin + yRel * cos;
  
    const x = xRot + cx;
    const y = yRot + cy;
  
    return [ x, y ];
  }

const getPoints = (word,angle) => {
    const positions = word.boundingBox
    const [ x1, y1 ] = rotatePointBackwards(positions[0], positions[1], angle)
    const [ x2, y2 ] = rotatePointBackwards(positions[2], positions[3], angle)
    const [ x3, y3 ] = rotatePointBackwards(positions[4], positions[5], angle)
    const [ x4, y4 ] = rotatePointBackwards(positions[6], positions[7], angle)
    return [ x1, y1, x2, y2, x3, y3, x4, y4 ]
}

function boundingBoxFromPoints(points) {
    if (points.length !== 8) {
      throw new Error('Input must be an array of 8 numbers.');
    }
  
    const xs = [points[0], points[2], points[4], points[6]];
    const ys = [points[1], points[3], points[5], points[7]];
  
    const xMin = Math.min(...xs);
    const yMin = Math.min(...ys);
    const xMax = Math.max(...xs);
    const yMax = Math.max(...ys);
  
    return {
      x: xMin,
      y: yMin,
      width: xMax - xMin,
      height: yMax - yMin
    };
  }
  


function rotateWord(word, angle) {
    return boundingBoxFromPoints(getPoints(word,angle))
}

const getLinePosition = (word) => {
    const linePosition = { xMin: Infinity, yMin: Infinity, yMax: -Infinity, xMax: -Infinity }
    const line = word.map(w => {
        linePosition.xMin = Math.min(linePosition.xMin, w.x)
        linePosition.yMin = Math.min(linePosition.yMin, w.y)
        linePosition.yMax = Math.max(linePosition.yMax, w.y + w.height)
        linePosition.xMax = Math.max(linePosition.xMax, w.x + w.width)
        return w.text
    }).join(' ')

    return {
        text: line,
        x: linePosition.xMin,
        y: linePosition.yMin,
        width: linePosition.xMax - linePosition.xMin,
        height: linePosition.yMax - linePosition.yMin,
    };
};

function groupLinesWithAngle(rawData, angle, imageWidth, imageHeight) {
    const rotatedWords = [];

    for (const line of rawData) {
        for (const word of line.words) {
            const { x, y,width,height } = rotateWord(word, angle, imageWidth, imageHeight);
            rotatedWords.push({ text: word.text, x, y, width,height });
        }
    }

    return {
        angle,
        lines: lines.map(line => getLinePosition(line.words))
    };
}


export const groupLinesAzure = (rawData)=>{
  return groupLinesWithAngle(rawData.readResults[0].lines, rawData.readResults[0].angle, 2000, 2000);
}