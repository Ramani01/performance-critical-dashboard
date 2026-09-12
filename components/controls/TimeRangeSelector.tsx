'use client';

import React from 'react';
import { useDashboardData } from '../providers/DataProvider';
import { AggregationInterval } from '../../lib/types';
import { Clock } from 'lucide-react';

const INTERVALS: { id: AggregationInterval; label: string }[] = [
  { id: 'raw', label: 'Raw Points' },
  { id: '1m', label: '1 Minute Bucket' },
  { id: '5m', label: '5 Minute Bucket' },
  { id: '1h', label: '1 Hour Bucket' },
];

export const TimeRangeSelector = React.memo(function TimeRangeSelector() {
  const { aggregationInterval, setAggregationInterval } = useDashboardData();

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-cyan-400" />
        <span className="text-sm font-semibold text-slate-200">Time-Series Aggregation:</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {INTERVALS.map((item) => {
          const isActive = aggregationInterval === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setAggregationInterval(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
});
