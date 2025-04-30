function groupWordsIntoColumns(words, tolerance = 20) {
    words.sort((a, b) => a.Left - b.Left);

    const columns = [];

    for (const word of words) {
        let added = false;
        for (const column of columns) {
            const avgLeft = column.reduce((sum, w) => sum + w.Left, 0) / column.length;
            if (Math.abs(word.Left - avgLeft) <= tolerance) {
                column.push(word);
                added = true;
                break;
            }
        }
        if (!added) {
            columns.push([word]);
        }
    }

    for (const column of columns) {
        column.sort((a, b) => a.Top - b.Top);
    }

    return columns;
}

function groupWordsIntoLines(words, tolerance = 20) {
    words.sort((a, b) => a.Top - b.Top);

    const lines = [];

    for (const word of words) {
        let added = false;
        for (const line of lines) {
            const avgTop = line.reduce((sum, w) => sum + w.Top, 0) / line.length;
            if (Math.abs(word.Top - avgTop) <= tolerance) {
                line.push(word);
                added = true;
                break;
            }
        }
        if (!added) {
            lines.push([word]);
        }
    }

    for (const line of lines) {
        line.sort((a, b) => a.Left - b.Left);
    }

    return lines;
}

const getLinePosition = (words) => {
    const linesPosition = []
    for (const word of words) {
        const linePosition = { xMin: Infinity, yMin: Infinity, yMax: -Infinity, xMax: -Infinity }
        const line = word.map(w => {
            linePosition.xMin = Math.min(linePosition.xMin, w.Left)
            linePosition.yMin = Math.min(linePosition.yMin, w.Top)
            linePosition.yMax = Math.max(linePosition.yMax, w.Top)
            linePosition.xMax = Math.max(linePosition.xMax, w.Left)
            return w.WordText
        }).join(' ')
        linesPosition.push({
            text: line,
            x: linePosition.xMin,
            y: linePosition.yMin,
            width: linePosition.xMax - linePosition.xMin,
            height: linePosition.yMax - linePosition.yMin,
        })
    };
    return linesPosition;
}

function rebuildVerticalTextFromWords(rawData) {
    const allWords = [];

    for (const block of rawData) {
        for (const word of block.Words) {
            allWords.push(word);
        }
    }

    const columns = groupWordsIntoColumns(allWords);
    return getLinePosition(columns);
}

function isVertical(words) {
    const lefts = words.map(w => w.Left);
    const tops = words.map(w => w.Top);

    const leftRange = Math.max(...lefts) - Math.min(...lefts);
    const topRange = Math.max(...tops) - Math.min(...tops);

    return leftRange < topRange;
}

function rebuildHorizontalTextFromWords(rawData) {
    const allWords = [];

    for (const block of rawData) {
        for (const word of block.Words) {
            allWords.push(word);
        }
    }

    const lines = groupWordsIntoLines(allWords);
    return getLinePosition(lines);
}


export const getTextPosition = (rawData) => {
    const allWords = [];
    for (const block of rawData) {
        for (const word of block.Words) {
            allWords.push(word);
        }
    }

    if (isVertical(allWords)) {
        const text = rebuildVerticalTextFromWords(rawData);
        return text;
    }
    const text = rebuildHorizontalTextFromWords(rawData);
    return text;
}

