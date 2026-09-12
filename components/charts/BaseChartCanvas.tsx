'use client';

import React, { useMemo } from 'react';
import { useChartRenderer } from '../../hooks/useChartRenderer';
import { calculateDataBounds, domainToScreen, screenToDomain } from '../../lib/canvasUtils';
import { DataPoint, ViewTransform } from '../../lib/types';
import { RotateCcw, ZoomIn } from 'lucide-react';

interface BaseChartCanvasProps {
  data: DataPoint[];
  children?: React.ReactNode;
  onDraw: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    transform: ViewTransform,
    bounds: ReturnType<typeof calculateDataBounds>
  ) => void;
  title?: string;
  subtitle?: string;
}

export function BaseChartCanvas({
  data,
  children,
  onDraw,
  title,
  subtitle,
}: BaseChartCanvasProps) {
  const bounds = useMemo(() => calculateDataBounds(data), [data]);

  const drawCallback = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    transform: ViewTransform
  ) => {
    onDraw(ctx, width, height, transform, bounds);
  };

  const {
    canvasRef,
    containerRef,
    dimensions,
    margin,
    transformRef,
    hoverPosition,
    resetView,
    mouseHandlers,
  } = useChartRenderer({
    onDraw: drawCallback,
  });

  const { width, height } = dimensions;
  const drawWidth = width - margin.left - margin.right;
  const drawHeight = height - margin.top - margin.bottom;

  // Calculate SVG Axis Ticks
  const xTicks = useMemo(() => {
    const ticksCount = Math.max(3, Math.floor(drawWidth / 120));
    const ticks: { x: number; label: string }[] = [];
    const step = (bounds.maxX - bounds.minX) / ticksCount;

    for (let i = 0; i <= ticksCount; i++) {
      const timestamp = bounds.minX + i * step;
      const date = new Date(timestamp);
      const label = `${date.getHours().toString().padStart(2, '0')}:${date
        .getMinutes()
        .toString()
        .padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
      ticks.push({ x: timestamp, label });
    }
    return ticks;
  }, [bounds.minX, bounds.maxX, drawWidth]);

  const yTicks = useMemo(() => {
    const ticksCount = Math.max(3, Math.floor(drawHeight / 50));
    const ticks: { y: number; label: string }[] = [];
    const step = (bounds.maxY - bounds.minY) / ticksCount;

    for (let i = 0; i <= ticksCount; i++) {
      const val = bounds.minY + i * step;
      ticks.push({ y: val, label: val.toFixed(1) });
    }
    return ticks;
  }, [bounds.minY, bounds.maxY, drawHeight]);

  // Screen domain coordinate calculation for hovered point lookup
  const hoveredDomain = useMemo(() => {
    if (!hoverPosition.show) return null;
    return screenToDomain(
      hoverPosition.px,
      hoverPosition.py,
      bounds,
      width,
      height,
      margin,
      transformRef.current
    );
  }, [hoverPosition, bounds, width, height, margin, transformRef]);

  // Find nearest data point to mouse hover
  const nearestPoint = useMemo(() => {
    if (!hoveredDomain || data.length === 0) return null;
    const targetTimestamp = hoveredDomain.x;
    let closest = data[0];
    let minDiff = Math.abs(data[0].timestamp - targetTimestamp);

    // Fast binary search or direct lookup
    for (let i = 1; i < data.length; i++) {
      const diff = Math.abs(data[i].timestamp - targetTimestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closest = data[i];
      }
    }
    return minDiff < 50000 ? closest : null;
  }, [hoveredDomain, data]);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Chart Header */}
      <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
        <div>
          {title && <h3 className="text-base font-semibold text-slate-100">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 bg-slate-800/60 px-2 py-1 rounded flex items-center gap-1">
            <ZoomIn className="w-3.5 h-3.5 text-cyan-400" /> Scroll to Zoom | Drag to Pan
          </span>
          <button
            onClick={resetView}
            className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors text-xs flex items-center gap-1"
            title="Reset Zoom & Pan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Main Chart Canvas + SVG Hybrid Container */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full min-h-[350px] cursor-crosshair select-none"
        {...mouseHandlers}
      >
        {/* Canvas Base Layer */}
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />

        {/* SVG Axes, Grid & Crosshair Layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
          <defs>
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />

          {/* Y Axis Grid & Labels */}
          {yTicks.map((tick, i) => {
            const { py } = domainToScreen(
              bounds.minX,
              tick.y,
              bounds,
              width,
              height,
              margin,
              transformRef.current
            );
            if (py < margin.top || py > height - margin.bottom) return null;

            return (
              <g key={`y-tick-${i}`}>
                <line
                  x1={margin.left}
                  y1={py}
                  x2={width - margin.right}
                  y2={py}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeDasharray="3 3"
                />
                <text
                  x={margin.left - 10}
                  y={py + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#94a3b8"
                  fontFamily="Inter, system-ui, sans-serif"
                >
                  {tick.label}
                </text>
              </g>
            );
          })}

          {/* X Axis Grid & Labels */}
          {xTicks.map((tick, i) => {
            const { px } = domainToScreen(
              tick.x,
              bounds.minY,
              bounds,
              width,
              height,
              margin,
              transformRef.current
            );
            if (px < margin.left || px > width - margin.right) return null;

            return (
              <g key={`x-tick-${i}`}>
                <line
                  x1={px}
                  y1={margin.top}
                  x2={px}
                  y2={height - margin.bottom}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeDasharray="3 3"
                />
                <text
                  x={px}
                  y={height - margin.bottom + 20}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#94a3b8"
                  fontFamily="Inter, system-ui, sans-serif"
                >
                  {tick.label}
                </text>
              </g>
            );
          })}

          {/* Interactive Hover Crosshair */}
          {hoverPosition.show &&
            hoverPosition.px >= margin.left &&
            hoverPosition.px <= width - margin.right &&
            hoverPosition.py >= margin.top &&
            hoverPosition.py <= height - margin.bottom && (
              <g>
                <line
                  x1={hoverPosition.px}
                  y1={margin.top}
                  x2={hoverPosition.px}
                  y2={height - margin.bottom}
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <line
                  x1={margin.left}
                  y1={hoverPosition.py}
                  x2={width - margin.right}
                  y2={hoverPosition.py}
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              </g>
            )}

          {/* Nearest Point Highlight Ring */}
          {nearestPoint && (
            <g>
              {(() => {
                const { px, py } = domainToScreen(
                  nearestPoint.timestamp,
                  nearestPoint.value,
                  bounds,
                  width,
                  height,
                  margin,
                  transformRef.current
                );
                return (
                  <circle
                    cx={px}
                    cy={py}
                    r="6"
                    fill="#38bdf8"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="animate-pulse"
                  />
                );
              })()}
            </g>
          )}
        </svg>

        {/* Floating Tooltip Component */}
        {nearestPoint && hoverPosition.show && (
          <div
            className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 bg-slate-950/95 border border-cyan-500/40 rounded-lg p-3 shadow-xl backdrop-blur-md text-xs text-slate-100 flex flex-col gap-1 min-w-[180px]"
            style={{
              left: `${hoverPosition.px}px`,
              top: `${hoverPosition.py - 10}px`,
            }}
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-1 text-slate-400">
              <span>{new Date(nearestPoint.timestamp).toLocaleTimeString()}</span>
              <span className="capitalize px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono">
                {nearestPoint.category}
              </span>
            </div>
            <div className="flex justify-between items-center font-mono">
              <span className="text-slate-400">Value:</span>
              <span className="text-cyan-300 font-semibold">{nearestPoint.value}</span>
            </div>
            <div className="flex justify-between items-center font-mono">
              <span className="text-slate-400">Secondary:</span>
              <span className="text-emerald-400">{nearestPoint.secondaryValue}</span>
            </div>
            <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1 mt-0.5 flex justify-between">
              <span>Source: {nearestPoint.metadata.source}</span>
              <span
                className={
                  nearestPoint.metadata.status === 'critical'
                    ? 'text-rose-400'
                    : nearestPoint.metadata.status === 'warning'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }
              >
                {nearestPoint.metadata.status}
              </span>
            </div>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
