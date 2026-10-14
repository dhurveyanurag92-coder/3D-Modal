import { DepthMapData, ViewSlot } from '../types';

/**
 * Turbo colormap gradient helper for scientific depth visualization
 */
function depthToTurboRgb(val: number): [number, number, number] {
  // val 0..1 (0 = farthest/deep, 1 = closest/prominent)
  const clamped = Math.max(0, Math.min(1, val));
  
  // Turbo colormap polynomial approximation
  const r = Math.round(
    255 *
      Math.max(
        0,
        Math.min(
          1,
          0.13572139 +
            clamped *
              (4.6153926 +
                clamped *
                  (-42.66032258 +
                    clamped * (132.13108234 + clamped * (-152.94239396 + clamped * 59.28637943))))
        )
      )
  );

  const g = Math.round(
    255 *
      Math.max(
        0,
        Math.min(
          1,
          0.09140261 +
            clamped *
              (2.19418839 +
                clamped *
                  (4.84296658 +
                    clamped * (-14.18503333 + clamped * (4.27729857 + clamped * 2.82956604))))
        )
      )
  );

  const b = Math.round(
    255 *
      Math.max(
        0,
        Math.min(
          1,
          0.1066733 +
            clamped *
              (12.64194608 +
                clamped *
                  (-60.58204836 +
                    clamped * (110.36276771 + clamped * (-89.90310912 + clamped * 27.34824973))))
        )
      )
  );

  return [r, g, b];
}

/**
 * Generates client-side relative depth map with full disclosure of algorithmic fallback.
 */
export async function generateDepthMap(
  imageUrl: string,
  view: ViewSlot,
  options?: {
    colorMap?: 'turbo' | 'grayscale' | 'plasma';
    smoothing?: number;
    sampleSize?: number;
    imageVersion?: string;
  }
): Promise<DepthMapData> {
  const size = options?.sampleSize || 256;
  const colormap = options?.colorMap || 'turbo';
  const imageVersion = options?.imageVersion || 'unknown_v';

  return new Promise((resolve, reject) => {
    if (!imageUrl || imageUrl.trim() === '') {
      reject(new Error(`Cannot generate depth map for ${view}: No image provided.`));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('Canvas 2D context unavailable');

        ctx.drawImage(img, 0, 0, size, size);
        const imgData = ctx.getImageData(0, 0, size, size);
        const data = imgData.data;

        const outCanvas = document.createElement('canvas');
        outCanvas.width = size;
        outCanvas.height = size;
        const outCtx = outCanvas.getContext('2d');
        if (!outCtx) throw new Error('Output canvas unavailable');

        const outImgData = outCtx.createImageData(size, size);
        const outData = outImgData.data;

        const depthGrid: number[][] = [];

        // Center coordinates for cranial ellipsoid projection
        const centerX = size * 0.5;
        const centerY = size * 0.45;
        const radiusX = size * 0.32;
        const radiusY = size * 0.40;

        for (let y = 0; y < size; y++) {
          const row: number[] = [];
          for (let x = 0; x < size; x++) {
            const idx = (y * size + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

            // Normalized distance from center of head
            const dx = (x - centerX) / radiusX;
            const dy = (y - centerY) / radiusY;
            const dSq = dx * dx + dy * dy;

            let depth = 0;
            if (dSq <= 1.0) {
              // Spherical dome falloff
              const sphereZ = Math.sqrt(Math.max(0, 1.0 - dSq));

              if (view === 'front') {
                // Face highlights (nose, forehead, cheeks) add positive relief
                const facialRelief = luma * 0.35;
                // Eye sockets recess
                const eyeY = (y - size * 0.38) / (size * 0.08);
                const eyeX = Math.abs(x - centerX) / (size * 0.16);
                const isEyeRegion = eyeX < 1.0 && Math.abs(eyeY) < 1.0;
                const eyeRecess = isEyeRegion ? -0.15 : 0;

                depth = sphereZ * 0.65 + facialRelief + eyeRecess;
              } else if (view === 'left') {
                // Left profile: nose points leftward (+Z), occipital is right
                const profileDepth = 0.5 + (0.5 - x / size) * 0.4 + sphereZ * 0.4;
                depth = profileDepth;
              } else if (view === 'right') {
                // Right profile: nose points rightward (+Z)
                const profileDepth = 0.5 + (x / size - 0.5) * 0.4 + sphereZ * 0.4;
                depth = profileDepth;
              } else {
                // Back view: rounded occipital skull convex surface
                depth = sphereZ * 0.8 + (1 - luma) * 0.15;
              }
            } else {
              // Background is zero depth
              depth = Math.max(0, (1 - Math.min(2, Math.sqrt(dSq))) * 0.15);
            }

            depth = Math.max(0, Math.min(1, depth));
            row.push(depth);

            if (colormap === 'grayscale') {
              const grey = Math.round(depth * 255);
              outData[idx] = grey;
              outData[idx + 1] = grey;
              outData[idx + 2] = grey;
              outData[idx + 3] = 255;
            } else {
              const [tr, tg, tb] = depthToTurboRgb(depth);
              outData[idx] = tr;
              outData[idx + 1] = tg;
              outData[idx + 2] = tb;
              outData[idx + 3] = 255;
            }
          }
          depthGrid.push(row);
        }

        outCtx.putImageData(outImgData, 0, 0);
        const depthImageUrl = outCanvas.toDataURL('image/png');

        resolve({
          view,
          imageVersion,
          depthImageUrl,
          rawDepthGrid: depthGrid,
          minDepth: 0.0,
          maxDepth: 1.0,
          method: 'local_heuristic_radial',
          disclaimer:
            'Heuristic/geometric estimate: Approximates cranial convexity and relative surface relief from 2D luminance and geometry. Not a physically calibrated metric LiDAR depth map.',
          notes:
            'Rendered client-side via radial ellipsoid falloff + luminance shading. Real ML models (e.g. MiDaS/Depth-Anything) require ONNX/WebGPU runtime which is optional.',
        });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error(`Failed to load image for depth generation: ${imageUrl}`));
    img.src = imageUrl;
  });
}
