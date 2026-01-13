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

    // Extraer Xs e Ys de los 4 puntos
    const xs = poly.map(p => p[0]);
    const ys = poly.map(p => p[1]);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    textRegions.push({
      text,
      confidence: score,
      x: minX,
      y: minY,
      width:  maxX - minX,
      height: maxY - minY,
    });
  }

  return {
    angle,
    regions: textRegions
  };
};
