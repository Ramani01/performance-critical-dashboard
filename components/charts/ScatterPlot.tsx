'use client';

import React from 'react';
import {
  CATEGORY_COLORS,
  calculateDataBounds,
  domainToScreen,
} from '../../lib/canvasUtils';
import { DataPoint, ViewTransform } from '../../lib/types';
import { BaseChartCanvas } from './BaseChartCanvas';

interface ScatterPlotProps {
  data: DataPoint[];
  title?: string;
  subtitle?: string;
}

export function ScatterPlot({
  data,
  title = 'Real-Time Scatter Cloud',
  subtitle = 'Multi-dimensional telemetry distribution (Timestamp vs Secondary Value)',
}: ScatterPlotProps) {
  const margin = { top: 30, right: 30, bottom: 40, left: 60 };

  const handleDraw = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    transform: ViewTransform,
    bounds: ReturnType<typeof calculateDataBounds>
  ) => {
    if (data.length === 0) return;

    // Use fast rect points for density > 20,000 points, else arc circles
    const isHighDensity = data.length > 20000;
    const pointRadius = Math.max(1.5, Math.min(4, 2.5 * transform.scaleX));

    // Group rendering by category to minimize ctx state changes
    const categoryGroups = new Map<string, DataPoint[]>();
    for (let i = 0; i < data.length; i++) {
      const pt = data[i];
      if (!categoryGroups.has(pt.category)) {
        categoryGroups.set(pt.category, []);
      }
      categoryGroups.get(pt.category)!.push(pt);
    }

    categoryGroups.forEach((pts, categoryKey) => {
      const color = CATEGORY_COLORS[categoryKey as keyof typeof CATEGORY_COLORS] || '#38bdf8';

      ctx.save();
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = isHighDensity ? 0 : 3;

      if (isHighDensity) {
        // High-density fast rect rendering
        for (let i = 0; i < pts.length; i++) {
          const pt = pts[i];
          const { px, py } = domainToScreen(
            pt.timestamp,
            pt.secondaryValue,
            bounds,
            width,
            height,
            margin,
            transform
          );
          if (px >= margin.left && px <= width - margin.right && py >= margin.top && py <= height - margin.bottom) {
            ctx.fillRect(px - pointRadius, py - pointRadius, pointRadius * 2, pointRadius * 2);
          }
        }
      } else {
        // High quality arc rendering
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
          const pt = pts[i];
          const { px, py } = domainToScreen(
            pt.timestamp,
            pt.secondaryValue,
            bounds,
            width,
            height,
            margin,
            transform
          );
          if (px >= margin.left && px <= width - margin.right && py >= margin.top && py <= height - margin.bottom) {
            ctx.moveTo(px + pointRadius, py);
            ctx.arc(px, py, pointRadius, 0, Math.PI * 2);
          }
        }
        ctx.fill();
      }

      ctx.restore();
    });
  };

  return <BaseChartCanvas data={data} onDraw={handleDraw} title={title} subtitle={subtitle} />;
}
