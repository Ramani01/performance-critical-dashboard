'use client';

import React from 'react';
import { useDashboardData } from '../providers/DataProvider';
import { formatNumber } from '../../lib/performanceUtils';
import { Cpu, HardDrive, Layers, Zap } from 'lucide-react';

export const PerformanceMonitor = React.memo(function PerformanceMonitor() {
  const { metrics } = useDashboardData();
  const {
    fps,
    frameTimeMs,
    processingTimeMs,
    pointCount,
    memoryHeapUsedMB,
    memoryHeapLimitMB,
    isMemorySupported,
    isStressTesting,
  } = metrics;

  // FPS Color indicator
  const fpsColor =
    fps >= 55 ? 'text-emerald-400' : fps >= 35 ? 'text-amber-400' : 'text-rose-400';

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-md flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          Empirical Performance HUD
        </h2>
        {isStressTesting && (
          <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-400 animate-pulse">
            STRESS TEST MODE ACTIVE
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* FPS Counter */}
        <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Framerate</span>
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl font-bold font-mono ${fpsColor}`}>{fps}</span>
            <span className="text-[10px] text-slate-500 font-mono">Target: 60 FPS</span>
          </div>
        </div>

        {/* Frame & Processing Time */}
        <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Render / Process</span>
            <span className="text-cyan-400 font-mono text-[10px]">rAF / Worker</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono text-cyan-300">
              {frameTimeMs} <span className="text-xs font-normal text-slate-400">ms</span>
            </span>
            <span className="text-xs font-mono text-emerald-400">
              {processingTimeMs} ms
            </span>
          </div>
        </div>

        {/* Active Point Density */}
        <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Points</span>
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-cyan-400">
              {formatNumber(pointCount)}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Bounded Window</span>
          </div>
        </div>

        {/* Memory Stats */}
        <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>JS Memory Heap</span>
            <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            {isMemorySupported && memoryHeapUsedMB !== null ? (
              <>
                <span className="text-lg font-bold font-mono text-emerald-400">
                  {memoryHeapUsedMB} <span className="text-xs font-normal text-slate-400">MB</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Limit: {memoryHeapLimitMB}MB
                </span>
              </>
            ) : (
              <span className="text-xs font-mono text-slate-500">
                API N/A in browser
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
