import { NormalMapData, ViewSlot } from '../types';

/**
 * Computes 3D surface normal map using 3x3 Sobel operator over luminance and surface relief.
 */
export async function generateNormalMap(
  imageUrl: string,
  view: ViewSlot,
  options?: {
    strength?: number;
    sampleSize?: number;
    imageVersion?: string;
  }
): Promise<NormalMapData> {
  const size = options?.sampleSize || 256;
  const strength = options?.strength ?? 2.5;
  const imageVersion = options?.imageVersion || 'unknown_v';

  return new Promise((resolve, reject) => {
    if (!imageUrl || imageUrl.trim() === '') {
      reject(new Error(`Cannot generate normal map for ${view}: No image provided.`));
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

        // Compute grayscale luminance buffer
        const luma = new Float32Array(size * size);
        for (let i = 0; i < size * size; i++) {
          const r = data[i * 4];
          const g = data[i * 4 + 1];
          const b = data[i * 4 + 2];
          luma[i] = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        }

        const outCanvas = document.createElement('canvas');
        outCanvas.width = size;
        outCanvas.height = size;
        const outCtx = outCanvas.getContext('2d');
        if (!outCtx) throw new Error('Output canvas unavailable');

        const outImgData = outCtx.createImageData(size, size);
        const outData = outImgData.data;

        // Sobel filtering for horizontal (dX) and vertical (dY) gradient
        for (let y = 1; y < size - 1; y++) {
          for (let x = 1; x < size - 1; x++) {
            const idx = y * size + x;

            // 3x3 Sobel X
            // [-1 0 1]
            // [-2 0 2]
            // [-1 0 1]
            const tl = luma[(y - 1) * size + (x - 1)];
            const t  = luma[(y - 1) * size + x];
            const tr = luma[(y - 1) * size + (x + 1)];
            const l  = luma[y * size + (x - 1)];
            const r  = luma[y * size + (x + 1)];
            const bl = luma[(y + 1) * size + (x - 1)];
            const b  = luma[(y + 1) * size + x];
            const br = luma[(y + 1) * size + (x + 1)];

            const dX = (tr + 2 * r + br) - (tl + 2 * l + bl);
            const dY = (bl + 2 * b + br) - (tl + 2 * t + tr);

            // Invert dY for standard OpenGL normal orientation
            let nx = -dX * strength;
            let ny = -dY * strength;
            let nz = 1.0;

            // Add spherical curvature normal for head region
            const cx = (x - size * 0.5) / (size * 0.35);
            const cy = (y - size * 0.45) / (size * 0.42);
            if (cx * cx + cy * cy < 1.0) {
              nx += cx * 0.7;
              ny += cy * 0.7;
            }

            // Normalize vector [nx, ny, nz]
            const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1.0;
            nx /= len;
            ny /= len;
            nz /= len;

            // Convert [-1, 1] range to [0, 255] RGB color values
            const pixelIdx = idx * 4;
            outData[pixelIdx]     = Math.round((nx * 0.5 + 0.5) * 255); // R = X normal
            outData[pixelIdx + 1] = Math.round((ny * 0.5 + 0.5) * 255); // G = Y normal
            outData[pixelIdx + 2] = Math.round((nz * 0.5 + 0.5) * 255); // B = Z normal
            outData[pixelIdx + 3] = 255;
          }
        }

        outCtx.putImageData(outImgData, 0, 0);
        const normalImageUrl = outCanvas.toDataURL('image/png');

        resolve({
          view,
          imageVersion,
          normalImageUrl,
          method: 'Local Sobel Filter (Luminance Gradient Convolution)',
          disclaimer:
            'Tangent-space estimate: Surface orientation vectors approximated from 2D pixel luminance gradients. Subject to lighting and surface shading.',
          notes:
            'Generated using dual-axis 3x3 Sobel kernel filtering on image luminance combined with cranial curvature orientation.',
        });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error(`Failed to load image for normal map: ${imageUrl}`));
    img.src = imageUrl;
  });
}
