export const paddleOCR = (ocrData) => {
  const recTexts  = ocrData.rec_texts  || [];
  const recScores = ocrData.rec_scores || [];
  const recPolys  = ocrData.rec_polys  || [];

  let angle = ocrData?.doc_preprocessor_res?.angle ?? 0;
  if (angle === -1) angle = 0;

  const textRegions = [];

  for (let i = 0; i < recPolys.length; i++) {
    const text  = (recTexts[i] || "").trim();
    const score = Number(recScores[i] || 0);
    const poly  = recPolys[i];

    if (!poly || poly.length !== 4) continue;
    
    const [p0, p1, p2, p3] = poly;

    const cx = (p0[0] + p2[0]) / 2;
    const cy = (p0[1] + p2[1]) / 2;
    
    const width  = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    const height = Math.hypot(p3[0] - p0[0], p3[1] - p0[1]);

    textRegions.push({
      text,
      confidence: score,
      x: cx - width / 2,
      y: cy - height / 2,
      width,
      height,
      poly 
    });
  }

  return {
    angle,
    regions: textRegions
  };
};
