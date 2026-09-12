'use client';

import React, { createContext, useContext, useState } from 'react';
import { useDataStream } from '../../hooks/useDataStream';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';
import {
  AggregatedPoint,
  AggregationInterval,
  ChartType,
  DataPoint,
  FilterOptions,
  PerformanceMetrics,
} from '../../lib/types';

interface DataContextValue {
  dataPoints: DataPoint[];
  filteredPoints: DataPoint[];
  aggregatedPoints: AggregatedPoint[];
  chartType: ChartType;
  setChartType: (type: ChartType) => void;
  isStreaming: boolean;
  setIsStreaming: (streaming: boolean) => void;
  isStressTesting: boolean;
  setIsStressTesting: (stress: boolean) => void;
  targetWorkload: number;
  resetDataset: (count: number) => void;
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  aggregationInterval: AggregationInterval;
  setAggregationInterval: (interval: AggregationInterval) => void;
  metrics: PerformanceMetrics;
  recordFrame: (
    timestamp: number,
    frameTimeMs: number,
    processingTimeMs: number,
    pointCount: number,
    isStressTesting: boolean
  ) => void;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [chartType, setChartType] = useState<ChartType>('line');

  const {
    dataPoints,
    filteredPoints,
    aggregatedPoints,
    isStreaming,
    setIsStreaming,
    isStressTesting,
    setIsStressTesting,
    processingTimeMs,
    targetWorkload,
    resetDataset,
    filters,
    setFilters,
    aggregationInterval,
    setAggregationInterval,
  } = useDataStream({
    initialPointCount: 10000,
    maxWindowSize: 100000,
  });

  const { metrics, recordFrame } = usePerformanceMonitor();

  return (
    <DataContext.Provider
      value={{
        dataPoints,
        filteredPoints,
        aggregatedPoints,
        chartType,
        setChartType,
        isStreaming,
        setIsStreaming,
        isStressTesting,
        setIsStressTesting,
        targetWorkload,
        resetDataset,
        filters,
        setFilters,
        aggregationInterval,
        setAggregationInterval,
        metrics: {
          ...metrics,
          processingTimeMs,
          pointCount: filteredPoints.length,
          isStressTesting,
        },
        recordFrame,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useDashboardData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDashboardData must be used within a DataProvider');
  }
  return context;
}
