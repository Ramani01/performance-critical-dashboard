import { CategoryType, ChartMargin, DataPoint, HeatmapBin, ViewTransform } from './types';

export const CATEGORY_COLORS: Record<CategoryType, string> = {
  alpha: '#38bdf8', // Vibrant Sky Blue
  beta: '#34d399',  // Vibrant Emerald
  gamma: '#f43f5e', // Vibrant Rose
  delta: '#a855f7', // Vibrant Purple
};

export const CATEGORY_COLORS_TRANSPARENT: Record<CategoryType, string> = {
  alpha: 'rgba(56, 189, 248, 0.35)',
  beta: 'rgba(52, 211, 153, 0.35)',
  gamma: 'rgba(244, 63, 94, 0.35)',
  delta: 'rgba(168, 85, 247, 0.35)',
};

/**
 * Initializes and scales a canvas element for HiDPI / Retina screens.
 */
export function setupCanvasDPI(
  canvas: HTMLCanvasElement,
  width: number,
  height: number
): { ctx: CanvasRenderingContext2D; dpr: number } | null {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return null;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.scale(dpr, dpr);
  return { ctx, dpr };
}

/**
 * Calculates coordinate bounds (minX, maxX, minY, maxY) from data points.
 */
export function calculateDataBounds(data: DataPoint[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minSecondaryY: number;
  maxSecondaryY: number;
} {
  if (data.length === 0) {
    const now = Date.now();
    return {
      minX: now - 60000,
      maxX: now,
      minY: -100,
      maxY: 100,
      minSecondaryY: -100,
      maxSecondaryY: 100,
    };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minSec = Infinity;
  let maxSec = -Infinity;

  for (let i = 0; i < data.length; i++) {
    const pt = data[i];
    if (pt.timestamp < minX) minX = pt.timestamp;
    if (pt.timestamp > maxX) maxX = pt.timestamp;
    if (pt.value < minY) minY = pt.value;
    if (pt.value > maxY) maxY = pt.value;
    if (pt.secondaryValue < minSec) minSec = pt.secondaryValue;
    if (pt.secondaryValue > maxSec) maxSec = pt.secondaryValue;
  }

  // Add 5% padding to Y range
  const ySpan = maxY - minY || 1;
  minY -= ySpan * 0.05;
  maxY += ySpan * 0.05;

  const secSpan = maxSec - minSec || 1;
  minSec -= secSpan * 0.05;
  maxSec += secSpan * 0.05;

  return {
    minX,
    maxX: maxX === minX ? maxX + 1000 : maxX,
    minY,
    maxY,
    minSecondaryY: minSec,
    maxSecondaryY: maxSec,
  };
}

/**
 * Maps a domain data value (x, y) to screen space pixels considering margins, zoom, pan.
 */
export function domainToScreen(
  x: number,
  y: number,
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  chartWidth: number,
  chartHeight: number,
  margin: ChartMargin,
  transform: ViewTransform
): { px: number; py: number } {
  const drawWidth = chartWidth - margin.left - margin.right;
  const drawHeight = chartHeight - margin.top - margin.bottom;

  const xNorm = (x - bounds.minX) / (bounds.maxX - bounds.minX || 1);
  const yNorm = (y - bounds.minY) / (bounds.maxY - bounds.minY || 1);

  // Apply zoom and pan transform
  const px = margin.left + (xNorm * drawWidth * transform.scaleX) + transform.offsetX;
  const py = margin.top + (drawHeight - (yNorm * drawHeight * transform.scaleY)) + transform.offsetY;

  return { px, py };
}

/**
 * Converts screen coordinate back to domain data values (inverse mapping for hover/tooltips).
 */
export function screenToDomain(
  px: number,
  py: number,
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  chartWidth: number,
  chartHeight: number,
  margin: ChartMargin,
  transform: ViewTransform
): { x: number; y: number } {
  const drawWidth = chartWidth - margin.left - margin.right;
  const drawHeight = chartHeight - margin.top - margin.bottom;

  const relPx = (px - margin.left - transform.offsetX) / (drawWidth * transform.scaleX);
  const relPy = (margin.top + drawHeight - py + transform.offsetY) / (drawHeight * transform.scaleY);

  const x = bounds.minX + relPx * (bounds.maxX - bounds.minX);
  const y = bounds.minY + relPy * (bounds.maxY - bounds.minY);

  return { x, y };
}

/**
 * Calculates adaptive downsampling (Min-Max Bucket Downsampling) for high point density (e.g. >10,000 points).
 * Preserves spikes, outliers, and wave shapes while reducing Canvas draw iterations.
 */
export function minMaxDownsample(data: DataPoint[], targetPoints: number): DataPoint[] {
  if (data.length <= targetPoints || targetPoints <= 0) return data;

  const sampled: DataPoint[] = [];
  const bucketSize = data.length / targetPoints;

  // Always keep first point
  sampled.push(data[0]);

  for (let i = 1; i < targetPoints - 1; i++) {
    const startIndex = Math.floor(i * bucketSize);
    const endIndex = Math.floor((i + 1) * bucketSize);

    let minPt = data[startIndex];
    let maxPt = data[startIndex];

    for (let j = startIndex + 1; j < endIndex && j < data.length; j++) {
      const pt = data[j];
      if (pt.value < minPt.value) minPt = pt;
      if (pt.value > maxPt.value) maxPt = pt;
    }

    // Append min and max in chronological order
    if (minPt.timestamp < maxPt.timestamp) {
      sampled.push(minPt);
      if (minPt !== maxPt) sampled.push(maxPt);
    } else {
      sampled.push(maxPt);
      if (minPt !== maxPt) sampled.push(minPt);
    }
  }

  // Always keep last point
  sampled.push(data[data.length - 1]);

  return sampled;
}

/**
 * Fast Heatmap Plasma Color Interpolator (0.0 -> 1.0 intensity)
 */
export function getHeatmapColor(intensity: number): string {
  const norm = Math.max(0, Math.min(1, intensity));
  // High-performance plasma palette: Dark Purple -> Cyan -> Emerald -> Yellow -> Pink/White
  if (norm < 0.2) {
    const t = norm / 0.2;
    return `rgb(${Math.floor(15 + t * 40)}, ${Math.floor(23 + t * 70)}, ${Math.floor(42 + t * 120)})`;
  } else if (norm < 0.5) {
    const t = (norm - 0.2) / 0.3;
    return `rgb(${Math.floor(55 - t * 40)}, ${Math.floor(93 + t * 100)}, ${Math.floor(162 + t * 80)})`;
  } else if (norm < 0.8) {
    const t = (norm - 0.5) / 0.3;
    return `rgb(${Math.floor(15 + t * 230)}, ${Math.floor(193 + t * 20)}, ${Math.floor(242 - t * 150)})`;
  } else {
    const t = (norm - 0.8) / 0.2;
    return `rgb(${Math.floor(245 + t * 10)}, ${Math.floor(213 - t * 150)}, ${Math.floor(92 + t * 50)})`;
  }
}

/**
 * Computes 2D Heatmap Grid Bins (Timestamp vs Secondary Value)
 */
export function computeHeatmapMatrix(
  data: DataPoint[],
  xBinsCount: number = 40,
  yBinsCount: number = 25
): { bins: HeatmapBin[]; maxCount: number } {
  if (data.length === 0) return { bins: [], maxCount: 1 };

  const bounds = calculateDataBounds(data);
  const xStep = (bounds.maxX - bounds.minX) / xBinsCount;
  const yStep = (bounds.maxSecondaryY - bounds.minSecondaryY) / yBinsCount;

  const grid: number[][] = Array.from({ length: xBinsCount }, () => new Array(yBinsCount).fill(0));
  const valGrid: number[][] = Array.from({ length: xBinsCount }, () => new Array(yBinsCount).fill(0));

  let maxCount = 0;

  for (let i = 0; i < data.length; i++) {
    const pt = data[i];
    const xBin = Math.min(xBinsCount - 1, Math.max(0, Math.floor((pt.timestamp - bounds.minX) / (xStep || 1))));
    const yBin = Math.min(yBinsCount - 1, Math.max(0, Math.floor((pt.secondaryValue - bounds.minSecondaryY) / (yStep || 1))));

    grid[xBin][yBin]++;
    valGrid[xBin][yBin] += pt.value;
    if (grid[xBin][yBin] > maxCount) {
      maxCount = grid[xBin][yBin];
    }
  }

  const bins: HeatmapBin[] = [];
  for (let x = 0; x < xBinsCount; x++) {
    for (let y = 0; y < yBinsCount; y++) {
      const count = grid[x][y];
      if (count > 0) {
        bins.push({
          xBin: x,
          yBin: y,
          count,
          avgValue: valGrid[x][y] / count,
          xRange: [bounds.minX + x * xStep, bounds.minX + (x + 1) * xStep],
          yRange: [bounds.minSecondaryY + y * yStep, bounds.minSecondaryY + (y + 1) * yStep],
        });
      }
    }
  }

  return { bins, maxCount };
}
