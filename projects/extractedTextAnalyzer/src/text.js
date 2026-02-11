export const text = (data) => {
    return data.map(item => {
        const [xMin, yMin, xMax, yMax] = item.bbox;
        return {
            text: item.text,
            x: xMin,
            y: yMin,
            width: xMax - xMin,
            height: yMax - yMin,
            confidence: 1
        };
    });
};
