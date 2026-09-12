'use client';

import React, { useMemo } from 'react';
import {
  calculateDataBounds,
  computeHeatmapMatrix,
  getHeatmapColor,
} from '../../lib/canvasUtils';
import { DataPoint, ViewTransform } from '../../lib/types';
import { BaseChartCanvas } from './BaseChartCanvas';

interface HeatmapProps {
  data: DataPoint[];
  title?: string;
  subtitle?: string;
}

export function Heatmap({
  data,
  title = 'Real-Time Heatmap Matrix',
  subtitle = '2D cell density intensity distribution across time and secondary metrics',
}: HeatmapProps) {
  const margin = { top: 30, right: 30, bottom: 40, left: 60 };

  const { bins, maxCount } = useMemo(() => {
    return computeHeatmapMatrix(data, 45, 30);
  }, [data]);

  const handleDraw = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    transform: ViewTransform,
    bounds: ReturnType<typeof calculateDataBounds>
  ) => {
    if (bins.length === 0) return;

    const drawWidth = width - margin.left - margin.right;
    const drawHeight = height - margin.top - margin.bottom;

    const xBinSize = (drawWidth / 45) * transform.scaleX;
    const yBinSize = (drawHeight / 30) * transform.scaleY;

    for (let i = 0; i < bins.length; i++) {
      const bin = bins[i];
      const intensity = bin.count / (maxCount || 1);
      const color = getHeatmapColor(intensity);

      const px = margin.left + bin.xBin * xBinSize + transform.offsetX;
      const py = margin.top + (30 - 1 - bin.yBin) * yBinSize + transform.offsetY;

      if (px + xBinSize >= margin.left && px <= width - margin.right && py + yBinSize >= margin.top && py <= height - margin.bottom) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 0.5;

        ctx.fillRect(px, py, xBinSize, yBinSize);
        ctx.strokeRect(px, py, xBinSize, yBinSize);
        ctx.restore();
      }
    }
  };

  return (
    <BaseChartCanvas data={data} onDraw={handleDraw} title={title} subtitle={subtitle}>
      {/* Heatmap Legend Overlay */}
      <div className="absolute bottom-4 right-4 z-30 flex items-center gap-2 bg-slate-950/90 border border-slate-800 rounded-lg px-3 py-1.5 backdrop-blur-md text-xs text-slate-300">
        <span>Low</span>
        <div className="w-24 h-3 rounded bg-gradient-to-r from-indigo-950 via-cyan-500 via-yellow-400 to-rose-500 border border-slate-700" />
        <span>High Density</span>
      </div>
    </BaseChartCanvas>
  );
}
