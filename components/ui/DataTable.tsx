'use client';

import React, { useRef } from 'react';
import { useDashboardData } from '../providers/DataProvider';
import { useVirtualization } from '../../hooks/useVirtualization';
import { CATEGORY_COLORS } from '../../lib/canvasUtils';
import { formatNumber } from '../../lib/performanceUtils';
import { Database } from 'lucide-react';

export const DataTable = React.memo(function DataTable() {
  const { filteredPoints } = useDashboardData();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const rowHeight = 44;
  const containerHeight = 350;

  const { virtualIndices, totalHeight, paddingTop, onScroll } = useVirtualization({
    totalItems: filteredPoints.length,
    rowHeight,
    containerHeight,
    overscan: 6,
  });

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md flex flex-col">
      {/* Table Header Controls */}
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-100">Virtualized Telemetry Records</h3>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Displaying {formatNumber(filteredPoints.length)} Records
        </div>
      </div>

      {/* Sticky Table Columns Header */}
      <div className="grid grid-cols-7 px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
        <span>Record ID</span>
        <span>Timestamp</span>
        <span>Primary Val</span>
        <span>Sec Val</span>
        <span>Category</span>
        <span>Sensor / Node</span>
        <span className="text-right">Status</span>
      </div>

      {/* Scrollable Virtual Window */}
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="w-full overflow-y-auto"
        style={{ height: `${containerHeight}px` }}
      >
        <div style={{ height: `${totalHeight}px`, paddingTop: `${paddingTop}px` }}>
          {virtualIndices.map((idx) => {
            const pt = filteredPoints[idx];
            if (!pt) return null;

            const categoryColor = CATEGORY_COLORS[pt.category] || '#38bdf8';
            const dateStr = new Date(pt.timestamp).toLocaleTimeString();

            return (
              <div
                key={pt.id}
                className="grid grid-cols-7 px-4 items-center border-b border-slate-800/40 hover:bg-slate-800/50 transition-colors text-xs font-mono text-slate-300"
                style={{ height: `${rowHeight}px` }}
              >
                <span className="truncate text-slate-400 text-[11px]">{pt.id}</span>
                <span className="text-slate-300">{dateStr}</span>
                <span className={pt.value >= 0 ? 'text-cyan-400 font-semibold' : 'text-rose-400 font-semibold'}>
                  {pt.value}
                </span>
                <span className="text-slate-400">{pt.secondaryValue}</span>
                <span className="flex items-center gap-1.5 capitalize">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColor }} />
                  {pt.category}
                </span>
                <span className="truncate text-slate-400">{pt.metadata.source}</span>
                <span className="text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      pt.metadata.status === 'critical'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : pt.metadata.status === 'warning'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {pt.metadata.status}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
