export const paddleORC = (resultJson) =>{
    const ocrData = resultJson.res || {};
    const recTexts = ocrData.rec_texts || [];
    const recScores = ocrData.rec_scores || [];
    const recBoxes = ocrData.rec_boxes || [];
    let angle = (ocrData.doc_preprocessor_res && ocrData.doc_preprocessor_res.angle) || 0;
    
    if (angle === -1) {
      angle = 0;
    }
    
    const textRegions = [];
    
    for (let i = 0; i < recTexts.length; i++) {
      const text = recTexts[i] || "";
      const score = recScores[i] || 0;
      const box = recBoxes[i] || [];
    
      const cleanText = text.trim();
    
      if (box.length >= 4) {
        const x1 = box[0];
        const y1 = box[1];
        const x2 = box[2];
        const y2 = box[3];
    
        textRegions.push({
          text: cleanText,
          bbox: {
            x: parseInt(x1),
            y: parseInt(y1),
            width: parseInt(x2 - x1),
            height: parseInt(y2 - y1),
          },
          confidence: Number(parseFloat(score).toFixed(3)),
        });
      }
    }

    return textRegions;
}

