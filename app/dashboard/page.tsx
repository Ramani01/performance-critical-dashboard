'use client';

import React from 'react';
import { DataProvider, useDashboardData } from '../../components/providers/DataProvider';
import { Header } from '../../components/ui/Header';
import { PerformanceMonitor } from '../../components/ui/PerformanceMonitor';
import { LoadControls } from '../../components/controls/LoadControls';
import { FilterPanel } from '../../components/controls/FilterPanel';
import { TimeRangeSelector } from '../../components/controls/TimeRangeSelector';
import { LineChart } from '../../components/charts/LineChart';
import { BarChart } from '../../components/charts/BarChart';
import { ScatterPlot } from '../../components/charts/ScatterPlot';
import { Heatmap } from '../../components/charts/Heatmap';
import { DataTable } from '../../components/ui/DataTable';

function ActiveChart() {
  const { chartType, filteredPoints } = useDashboardData();

  switch (chartType) {
    case 'line':
      return <LineChart data={filteredPoints} />;
    case 'bar':
      return <BarChart data={filteredPoints} />;
    case 'scatter':
      return <ScatterPlot data={filteredPoints} />;
    case 'heatmap':
      return <Heatmap data={filteredPoints} />;
    default:
      return <LineChart data={filteredPoints} />;
  }
}

function DashboardContent() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Performance Monitor HUD */}
        <PerformanceMonitor />

        {/* Workload & Stress Controls */}
        <LoadControls />

        {/* Time-Series Aggregation & Filter Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TimeRangeSelector />
          </div>
          <div>
            <FilterPanel />
          </div>
        </div>

        {/* Primary Interactive Chart Canvas Workspace */}
        <section className="w-full h-[480px]">
          <ActiveChart />
        </section>

        {/* Virtualized High-Density Telemetry Table */}
        <section className="w-full">
          <DataTable />
        </section>
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        Performance-Critical Real-Time Data Visualization Engine &copy; 2026. Built with Next.js 14+ App Router, Canvas 2D &amp; Web Workers.
      </footer>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DataProvider>
      <DashboardContent />
    </DataProvider>
  );
}
