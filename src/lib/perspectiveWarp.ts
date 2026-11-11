/**
 * Perspective unskew & quad warp engine.
 * Computes exact 3x3 projective homography matrix and maps skewed quadrilateral to flat rectangular canvas.
 */

export interface Point {
  x: number;
  y: number;
}

export interface QuadCorners {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
}

// Compute 3x3 homography matrix mapping (u, v) in target rectangle to (x, y) in source quad
// Using standard Gaussian elimination on 8x8 system
export function getPerspectiveTransform(
  src: [Point, Point, Point, Point],
  dst: [Point, Point, Point, Point]
): number[] | null {
  // dst -> src mapping for backward texture lookup
  const a: number[][] = [];
  const b: number[] = [];

  for (let i = 0; i < 4; i++) {
    const sx = dst[i].x; // target x
    const sy = dst[i].y; // target y
    const dx = src[i].x; // source x
    const dy = src[i].y; // source y

    a.push([sx, sy, 1, 0, 0, 0, -sx * dx, -sy * dx]);
    b.push(dx);
    a.push([0, 0, 0, sx, sy, 1, -sx * dy, -sy * dy]);
    b.push(dy);
  }

  // Gaussian elimination
  const n = 8;
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(a[k][i]) > Math.abs(a[maxRow][i])) {
        maxRow = k;
      }
    }
    const tempA = a[i];
    a[i] = a[maxRow];
    a[maxRow] = tempA;
    const tempB = b[i];
    b[i] = b[maxRow];
    b[maxRow] = tempB;

    if (Math.abs(a[i][i]) < 1e-12) return null;

    for (let k = i + 1; k < n; k++) {
      const c = -a[k][i] / a[i][i];
      for (let j = i; j < n; j++) {
        if (i === j) {
          a[k][j] = 0;
        } else {
          a[k][j] += c * a[i][j];
        }
      }
      b[k] += c * b[i];
    }
  }

  const x = new Array(8).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) {
      sum += a[i][j] * x[j];
    }
    x[i] = (b[i] - sum) / a[i][i];
  }

  // Homography matrix: [h0, h1, h2, h3, h4, h5, h6, h7, 1]
  return [x[0], x[1], x[2], x[3], x[4], x[5], x[6], x[7], 1];
}

/**
 * Warps a quad region from source image to a flat rectangular canvas
 */
export function warpPerspective(
  sourceCanvas: HTMLCanvasElement,
  corners: QuadCorners,
  targetWidth?: number,
  targetHeight?: number
): HTMLCanvasElement {
  const { topLeft, topRight, bottomRight, bottomLeft } = corners;

  // Auto-calculate dimensions if not provided based on average quad width & height
  const topWidth = Math.hypot(topRight.x - topLeft.x, topRight.y - topLeft.y);
  const bottomWidth = Math.hypot(bottomRight.x - bottomLeft.x, bottomRight.y - bottomLeft.y);
  const leftHeight = Math.hypot(bottomLeft.x - topLeft.x, bottomLeft.y - topLeft.y);
  const rightHeight = Math.hypot(bottomRight.x - topRight.x, bottomRight.y - topRight.y);

  const outW = Math.round(targetWidth || Math.max(topWidth, bottomWidth));
  const outH = Math.round(targetHeight || Math.max(leftHeight, rightHeight));

  const outCanvas = document.createElement("canvas");
  outCanvas.width = Math.max(10, Math.min(outW, 4000));
  outCanvas.height = Math.max(10, Math.min(outH, 4000));
  const outCtx = outCanvas.getContext("2d", { willReadFrequently: true });
  const srcCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });

  if (!outCtx || !srcCtx) return outCanvas;

  const srcImgData = srcCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const dstImgData = outCtx.createImageData(outCanvas.width, outCanvas.height);

  const srcWidth = sourceCanvas.width;
  const srcHeight = sourceCanvas.height;
  const srcPixels = srcImgData.data;
  const dstPixels = dstImgData.data;

  const srcQuad: [Point, Point, Point, Point] = [topLeft, topRight, bottomRight, bottomLeft];
  const dstQuad: [Point, Point, Point, Point] = [
    { x: 0, y: 0 },
    { x: outCanvas.width, y: 0 },
    { x: outCanvas.width, y: outCanvas.height },
    { x: 0, y: outCanvas.height },
  ];

  const H = getPerspectiveTransform(srcQuad, dstQuad);
  if (!H) {
    // fallback direct draw
    outCtx.drawImage(sourceCanvas, 0, 0, outCanvas.width, outCanvas.height);
    return outCanvas;
  }

  const [h0, h1, h2, h3, h4, h5, h6, h7, h8] = H;

  const dw = outCanvas.width;
  const dh = outCanvas.height;

  for (let dy = 0; dy < dh; dy++) {
    const rowOffset = dy * dw * 4;
    for (let dx = 0; dx < dw; dx++) {
      const w = h6 * dx + h7 * dy + h8;
      if (Math.abs(w) < 1e-7) continue;

      const sx = (h0 * dx + h1 * dy + h2) / w;
      const sy = (h3 * dx + h4 * dy + h5) / w;

      if (sx >= 0 && sx < srcWidth - 1 && sy >= 0 && sy < srcHeight - 1) {
        // Bilinear interpolation
        const x0 = Math.floor(sx);
        const y0 = Math.floor(sy);
        const x1 = x0 + 1;
        const y1 = y0 + 1;

        const fx = sx - x0;
        const fy = sy - y0;
        const ifx = 1 - fx;
        const ify = 1 - fy;

        const w00 = ifx * ify;
        const w10 = fx * ify;
        const w01 = ifx * fy;
        const w11 = fx * fy;

        const idx00 = (y0 * srcWidth + x0) * 4;
        const idx10 = (y0 * srcWidth + x1) * 4;
        const idx01 = (y1 * srcWidth + x0) * 4;
        const idx11 = (y1 * srcWidth + x1) * 4;

        const dstIdx = rowOffset + dx * 4;

        dstPixels[dstIdx] = Math.round(
          srcPixels[idx00] * w00 + srcPixels[idx10] * w10 + srcPixels[idx01] * w01 + srcPixels[idx11] * w11
        );
        dstPixels[dstIdx + 1] = Math.round(
          srcPixels[idx00 + 1] * w00 + srcPixels[idx10 + 1] * w10 + srcPixels[idx01 + 1] * w01 + srcPixels[idx11 + 1] * w11
        );
        dstPixels[dstIdx + 2] = Math.round(
          srcPixels[idx00 + 2] * w00 + srcPixels[idx10 + 2] * w10 + srcPixels[idx01 + 2] * w01 + srcPixels[idx11 + 2] * w11
        );
        dstPixels[dstIdx + 3] = Math.round(
          srcPixels[idx00 + 3] * w00 + srcPixels[idx10 + 3] * w10 + srcPixels[idx01 + 3] * w01 + srcPixels[idx11 + 3] * w11
        );
      }
    }
  }

  outCtx.putImageData(dstImgData, 0, 0);
  return outCanvas;
}
