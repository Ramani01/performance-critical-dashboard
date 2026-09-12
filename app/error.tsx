'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard Error Boundary Caught Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-6">
      <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 mb-4">
        <AlertTriangle className="w-10 h-10" />
      </div>
      <h2 className="text-xl font-bold tracking-wide">Telemetry Rendering Exception</h2>
      <p className="text-sm text-slate-400 max-w-md text-center mt-2 font-mono">
        {error.message || 'An unexpected rendering error occurred in the Canvas engine.'}
      </p>
      <button
        onClick={() => reset()}
        className="mt-6 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-cyan-500/20"
      >
        <RotateCcw className="w-4 h-4" />
        Reset Canvas Session
      </button>
    </div>
  );
}
