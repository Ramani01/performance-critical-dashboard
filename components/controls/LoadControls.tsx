'use client';

import React from 'react';
import { useDashboardData } from '../providers/DataProvider';
import { formatNumber } from '../../lib/performanceUtils';
import { Flame, Minus, Play, Plus, Pause, Sliders } from 'lucide-react';

const PRESETS = [1000, 5000, 10000, 25000, 50000, 100000];

export const LoadControls = React.memo(function LoadControls() {
  const {
    targetWorkload,
    resetDataset,
    isStreaming,
    setIsStreaming,
    isStressTesting,
    setIsStressTesting,
  } = useDashboardData();

  const handleStepWorkload = (delta: number) => {
    const newWorkload = Math.max(1000, Math.min(100000, targetWorkload + delta));
    resetDataset(newWorkload);
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-md flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          Workload & Stress Controls
        </h3>
        <span className="text-xs text-cyan-400 font-mono">
          Target: {formatNumber(targetWorkload)} Points
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Preset Workload Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400 mr-1">Presets:</span>
          {PRESETS.map((count) => (
            <button
              key={count}
              onClick={() => resetDataset(count)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                targetWorkload === count
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {count >= 1000 ? `${count / 1000}k` : count}
            </button>
          ))}
        </div>

        {/* Incremental Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleStepWorkload(-5000)}
            disabled={targetWorkload <= 1000}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded transition-colors"
            title="Decrease by 5,000 points"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleStepWorkload(5000)}
            disabled={targetWorkload >= 100000}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded transition-colors"
            title="Increase by 5,000 points"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Stream Toggle */}
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isStreaming
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
            }`}
          >
            {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isStreaming ? 'Pause Stream' : 'Start Stream'}
          </button>

          {/* Stress Test Mode Trigger */}
          <button
            onClick={() => setIsStressTesting(!isStressTesting)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all border ${
              isStressTesting
                ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30 animate-pulse'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40'
            }`}
          >
            <Flame className="w-4 h-4 text-rose-400" />
            {isStressTesting ? 'Stop Stress Test' : 'Stress Test (30ms Burst)'}
          </button>
        </div>
      </div>
    </div>
  );
});
