import React from 'react';
import { Activity } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-6">
      <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl animate-pulse text-cyan-400 mb-4">
        <Activity className="w-10 h-10 animate-spin" />
      </div>
      <h2 className="text-lg font-bold tracking-wide">Initializing Telemetry Engine</h2>
      <p className="text-xs text-slate-400 mt-1">Pre-allocating Canvas 2D buffers &amp; Web Workers...</p>
    </div>
  );
}
