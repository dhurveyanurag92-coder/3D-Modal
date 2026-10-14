import { SilhouetteData, ViewSlot } from '../types';

/**
 * Extracts head silhouette, contour boundaries, and horizontal cross-sectional spans
 * using client-side Canvas pixel processing and color-contrast boundary detection.
 * Documented method: Local Color-Contrast Background Thresholding (Geometric Fallback).
 */
export async function extractHeadSilhouette(
  imageUrl: string,
  view: ViewSlot,
  options?: {
    threshold?: number;
    inverted?: boolean;
    imageVersion?: string;
    sampleWidth?: number;
    sampleHeight?: number;
  }
): Promise<SilhouetteData> {
  const targetW = options?.sampleWidth || 320;
  const targetH = options?.sampleHeight || 320;
  const threshold = options?.threshold ?? 28;
  const inverted = options?.inverted ?? false;
  const imageVersion = options?.imageVersion || 'unknown_v';

  return new Promise((resolve, reject) => {
    if (!imageUrl || imageUrl.trim() === '') {
      reject(new Error(`Cannot extract silhouette for ${view}: No image provided.`));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          throw new Error('Canvas 2D context unavailable');
        }

        ctx.drawImage(img, 0, 0, targetW, targetH);
        const imgData = ctx.getImageData(0, 0, targetW, targetH);
        const data = imgData.data;

        // Sample background color from top corners (assumed background region)
        let bgR = 0, bgG = 0, bgB = 0, bgCount = 0;
        const cornerSize = 12;
        for (let y = 0; y < cornerSize; y++) {
          for (let x = 0; x < cornerSize; x++) {
            const idx = (y * targetW + x) * 4;
            bgR += data[idx];
            bgG += data[idx + 1];
            bgB += data[idx + 2];
            bgCount++;
          }
          for (let x = targetW - cornerSize; x < targetW; x++) {
            const idx = (y * targetW + x) * 4;
            bgR += data[idx];
            bgG += data[idx + 1];
            bgB += data[idx + 2];
            bgCount++;
          }
        }
        bgR /= bgCount;
        bgG /= bgCount;
        bgB /= bgCount;

        // Create mask canvas
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = targetW;
        maskCanvas.height = targetH;
        const maskCtx = maskCanvas.getContext('2d');
        if (!maskCtx) throw new Error('Mask canvas context unavailable');

        const maskImgData = maskCtx.createImageData(targetW, targetH);
        const maskData = maskImgData.data;

        const horizontalSpans: Array<{ y: number; minX: number; maxX: number; width: number }> = [];
        let totalForegroundPx = 0;

        for (let y = 0; y < targetH; y++) {
          let rowMinX = -1;
          let rowMaxX = -1;

          for (let x = 0; x < targetW; x++) {
            const idx = (y * targetW + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // Color Euclidean distance from background sample
            const diff = Math.sqrt(
              Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
            );

            let isForeground = diff > threshold;
            if (inverted) {
              isForeground = !isForeground;
            }

            if (isForeground) {
              totalForegroundPx++;
              maskData[idx] = 255;     // White
              maskData[idx + 1] = 255;
              maskData[idx + 2] = 255;
              maskData[idx + 3] = 230; // Alpha

              if (rowMinX === -1) rowMinX = x;
              rowMaxX = x;
            } else {
              maskData[idx] = 15;      // Dark background
              maskData[idx + 1] = 23;
              maskData[idx + 2] = 42;
              maskData[idx + 3] = 0;   // Transparent
            }
          }

          if (rowMinX !== -1 && rowMaxX !== -1 && rowMaxX > rowMinX) {
            horizontalSpans.push({
              y: y / targetH,
              minX: rowMinX / targetW,
              maxX: rowMaxX / targetW,
              width: (rowMaxX - rowMinX) / targetW,
            });
          }
        }

        maskCtx.putImageData(maskImgData, 0, 0);
        const maskDataUrl = maskCanvas.toDataURL('image/png');

        // Extract perimeter contour points
        const contourPoints: Array<{ x: number; y: number }> = [];
        const step = 4;
        // Top-to-bottom right edge
        for (let y = 0; y < targetH; y += step) {
          const span = horizontalSpans.find((s) => Math.abs(s.y * targetH - y) <= step / 2);
          if (span) {
            contourPoints.push({ x: span.maxX, y: span.y });
          }
        }
        // Bottom-to-top left edge
        for (let y = targetH - 1; y >= 0; y -= step) {
          const span = horizontalSpans.find((s) => Math.abs(s.y * targetH - y) <= step / 2);
          if (span) {
            contourPoints.push({ x: span.minX, y: span.y });
          }
        }

        const totalPixels = targetW * targetH;
        const foregroundFraction = Number((totalForegroundPx / totalPixels).toFixed(3));

        let quality: SilhouetteData['quality'] = 'valid';
        let notes = `Extracted via local background color-distance thresholding (delta > ${threshold}).`;
        if (foregroundFraction < 0.05) {
          quality = 'warning';
          notes += ' Warning: Very small foreground detected (<5% of image). Consider reducing threshold.';
        } else if (foregroundFraction > 0.92) {
          quality = 'warning';
          notes += ' Warning: Mask covers >92% of frame. Background color may not contrast well.';
        }

        resolve({
          view,
          imageVersion,
          maskDataUrl,
          contourPoints,
          horizontalSpans,
          areaPixels: totalForegroundPx,
          foregroundFraction,
          threshold,
          inverted,
          quality,
          notes,
        });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => {
      reject(new Error(`Failed to load image for silhouette extraction: ${imageUrl}`));
    };
    img.src = imageUrl;
  });
}
