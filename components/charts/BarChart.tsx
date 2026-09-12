'use client';

import React from 'react';
import {
  CATEGORY_COLORS,
  calculateDataBounds,
  domainToScreen,
} from '../../lib/canvasUtils';
import { DataPoint, ViewTransform } from '../../lib/types';
import { BaseChartCanvas } from './BaseChartCanvas';

interface BarChartProps {
  data: DataPoint[];
  title?: string;
  subtitle?: string;
}

export function BarChart({
  data,
  title = 'Real-Time Bar Density',
  subtitle = 'Category & time binned bar distribution',
}: BarChartProps) {
  const margin = { top: 30, right: 30, bottom: 40, left: 60 };

  const handleDraw = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    transform: ViewTransform,
    bounds: ReturnType<typeof calculateDataBounds>
  ) => {
    if (data.length === 0) return;

    const drawWidth = width - margin.left - margin.right;
    const drawHeight = height - margin.top - margin.bottom;

    // Aggregate points into fixed screen column bins (e.g. 50-80 bins across screen)
    const binCount = Math.max(20, Math.min(80, Math.floor(drawWidth / 12)));
    const binStepMs = (bounds.maxX - bounds.minX) / binCount;

    const bins = new Array(binCount).fill(0).map(() => ({
      count: 0,
      sumValue: 0,
      categories: { alpha: 0, beta: 0, gamma: 0, delta: 0 },
      timestamp: 0,
    }));

    for (let i = 0; i < data.length; i++) {
      const pt = data[i];
      const binIdx = Math.min(
        binCount - 1,
        Math.max(0, Math.floor((pt.timestamp - bounds.minX) / (binStepMs || 1)))
      );
      bins[binIdx].count++;
      bins[binIdx].sumValue += pt.value;
      bins[binIdx].categories[pt.category]++;
      bins[binIdx].timestamp = bounds.minX + (binIdx + 0.5) * binStepMs;
    }

    const barWidth = Math.max(4, (drawWidth / binCount) * 0.75 * transform.scaleX);
    const zeroY = domainToScreen(
      bounds.minX,
      0,
      bounds,
      width,
      height,
      margin,
      transform
    ).py;

    for (let i = 0; i < binCount; i++) {
      const bin = bins[i];
      if (bin.count === 0) continue;

      const avgValue = bin.sumValue / bin.count;
      const { px, py } = domainToScreen(
        bin.timestamp,
        avgValue,
        bounds,
        width,
        height,
        margin,
        transform
      );

      // Determine primary category color
      let topCategory: keyof typeof CATEGORY_COLORS = 'alpha';
      let maxCatCount = 0;
      (Object.keys(bin.categories) as (keyof typeof CATEGORY_COLORS)[]).forEach((cat) => {
        if (bin.categories[cat] > maxCatCount) {
          maxCatCount = bin.categories[cat];
          topCategory = cat;
        }
      });

      const color = CATEGORY_COLORS[topCategory] || '#38bdf8';

      ctx.save();
      ctx.fillStyle = color;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;

      const barHeight = Math.abs(zeroY - py);
      const topY = avgValue >= 0 ? py : zeroY;

      // Draw Bar
      ctx.beginPath();
      ctx.rect(px - barWidth / 2, topY, barWidth, Math.max(2, barHeight));
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  };

  return <BaseChartCanvas data={data} onDraw={handleDraw} title={title} subtitle={subtitle} />;
}
