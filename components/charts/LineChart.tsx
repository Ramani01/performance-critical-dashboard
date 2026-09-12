'use client';

import React from 'react';
import {
  CATEGORY_COLORS,
  calculateDataBounds,
  domainToScreen,
  minMaxDownsample,
} from '../../lib/canvasUtils';
import { DataPoint, ViewTransform } from '../../lib/types';
import { BaseChartCanvas } from './BaseChartCanvas';

interface LineChartProps {
  data: DataPoint[];
  title?: string;
  subtitle?: string;
}

export const LineChart = React.memo(function LineChart({
  data,
  title = 'Real-Time Line Telemetry',
  subtitle = 'High-density time-series visualization with adaptive downsampling',
}: LineChartProps) {
  const margin = { top: 30, right: 30, bottom: 40, left: 60 };

  const handleDraw = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    transform: ViewTransform,
    bounds: ReturnType<typeof calculateDataBounds>
  ) => {
    if (data.length === 0) return;

    // Apply adaptive downsampling if density exceeds 5,000 points
    const drawWidth = width - margin.left - margin.right;
    const targetPoints = Math.max(1000, Math.floor(drawWidth * 3));
    const renderPoints = data.length > 5000 ? minMaxDownsample(data, targetPoints) : data;

    // Separate data by category for multi-series rendering
    const categoryMap = new Map<string, DataPoint[]>();
    for (let i = 0; i < renderPoints.length; i++) {
      const pt = renderPoints[i];
      if (!categoryMap.has(pt.category)) {
        categoryMap.set(pt.category, []);
      }
      categoryMap.get(pt.category)!.push(pt);
    }

    // Render each category line series
    categoryMap.forEach((pts, categoryKey) => {
      if (pts.length < 2) return;

      const color = CATEGORY_COLORS[categoryKey as keyof typeof CATEGORY_COLORS] || '#38bdf8';

      ctx.save();
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 4;

      const firstPoint = domainToScreen(
        pts[0].timestamp,
        pts[0].value,
        bounds,
        width,
        height,
        margin,
        transform
      );
      ctx.moveTo(firstPoint.px, firstPoint.py);

      for (let i = 1; i < pts.length; i++) {
        const { px, py } = domainToScreen(
          pts[i].timestamp,
          pts[i].value,
          bounds,
          width,
          height,
          margin,
          transform
        );
        ctx.lineTo(px, py);
      }

      ctx.stroke();

      // Render subtle gradient fill under line path
      const lastPoint = domainToScreen(
        pts[pts.length - 1].timestamp,
        pts[pts.length - 1].value,
        bounds,
        width,
        height,
        margin,
        transform
      );
      const bottomY = height - margin.bottom;

      ctx.lineTo(lastPoint.px, bottomY);
      ctx.lineTo(firstPoint.px, bottomY);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(0, margin.top, 0, bottomY);
      gradient.addColorStop(0, color.replace(')', ', 0.15)').replace('rgb', 'rgba'));
      gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = gradient;
      ctx.shadowBlur = 0;
      ctx.fill();

      ctx.restore();
    });
  };

  return <BaseChartCanvas data={data} onDraw={handleDraw} title={title} subtitle={subtitle} />;
});
