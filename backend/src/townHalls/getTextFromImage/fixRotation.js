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


function rebuildVerticalTextFromWords(rawData) {
    const allWords = [];

    for (const block of rawData) {
        for (const word of block.Words) {
            allWords.push(word);
        }
    }

    const columns = groupWordsIntoColumns(allWords);

    const finalText = columns.map(column =>
        column.map(w => w.WordText).join(' ')
    ).join('\n');

    return finalText;
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

    return lines.map(line => line.map(w => w.WordText).join(' ')).join('\n');
}


export const fixTextRotation = (rawData) => {
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

