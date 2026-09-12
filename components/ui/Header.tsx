'use client';

import React from 'react';
import { useDashboardData } from '../providers/DataProvider';
import { ChartType } from '../../lib/types';
import { Activity, BarChart2, Grid, LineChart as LineIcon, ScatterChart } from 'lucide-react';

const CHART_TYPES: { id: ChartType; label: string; icon: React.ElementType }[] = [
  { id: 'line', label: 'Line Chart', icon: LineIcon },
  { id: 'bar', label: 'Bar Chart', icon: BarChart2 },
  { id: 'scatter', label: 'Scatter Plot', icon: ScatterChart },
  { id: 'heatmap', label: 'Heatmap', icon: Grid },
];

export function Header() {
  const { chartType, setChartType, isStreaming, setIsStreaming } = useDashboardData();

  return (
    <header className="w-full bg-slate-950 border-b border-slate-800/80 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/20 text-white">
          <Activity className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            FlamAi Telemetry Engine
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              App Router v14+
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Real-Time 100,000+ Data Point Canvas 2D + SVG Visualization Dashboard
          </p>
        </div>
      </div>

      {/* Chart Type Selector */}
      <div className="flex items-center bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl gap-1">
        {CHART_TYPES.map((item) => {
          const Icon = item.icon;
          const isActive = chartType === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setChartType(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Live Stream Status Indicator */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsStreaming(!isStreaming)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
            isStreaming
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isStreaming ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'
            }`}
          />
          {isStreaming ? 'Streaming Live (100ms)' : 'Stream Paused'}
        </button>
      </div>
    </header>
  );
}
