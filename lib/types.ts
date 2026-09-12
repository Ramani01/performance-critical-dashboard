/**
 * Core type definitions for the Performance-Critical Real-Time Dashboard.
 */

export type CategoryType = 'alpha' | 'beta' | 'gamma' | 'delta';

export interface DataPointMetadata {
  source: string;
  status: 'normal' | 'warning' | 'critical';
  location: string;
  sensorId: number;
}

export interface DataPoint {
  id: string;
  timestamp: number; // Unix timestamp in milliseconds
  value: number; // Primary time-series value
  secondaryValue: number; // Used for 2D Scatter/Heatmap positioning
  category: CategoryType;
  metadata: DataPointMetadata;
}

export type ChartType = 'line' | 'bar' | 'scatter' | 'heatmap';

export type AggregationInterval = 'raw' | '1m' | '5m' | '1h';

export interface FilterOptions {
  categories: CategoryType[];
  valueRange: [number, number];
  timeWindowMs: number | null; // e.g. 60000 for 1m window, null for all
  searchQuery: string;
}

export interface ViewTransform {
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
}

export interface PerformanceMetrics {
  fps: number;
  frameTimeMs: number;
  processingTimeMs: number;
  pointCount: number;
  memoryHeapUsedMB: number | null;
  memoryHeapLimitMB: number | null;
  isMemorySupported: boolean;
  isStressTesting: boolean;
  lastUpdateTimestamp: number;
}

export interface ChartMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface AggregatedPoint {
  timestamp: number;
  avgValue: number;
  minValue: number;
  maxValue: number;
  count: number;
  category?: CategoryType;
}

export interface HeatmapBin {
  xBin: number;
  yBin: number;
  count: number;
  avgValue: number;
  xRange: [number, number];
  yRange: [number, number];
}

// Web Worker Communication Interfaces
export type WorkerAction = 'INITIALIZE' | 'PROCESS_DATA' | 'AGGREGATE' | 'RESET';

export interface WorkerRequestData {
  action: WorkerAction;
  payload: {
    dataPoints?: DataPoint[];
    targetCount?: number;
    filters?: FilterOptions;
    aggregationInterval?: AggregationInterval;
    maxWindowSize?: number;
  };
}

export interface WorkerResponseData {
  type: 'INITIALIZED' | 'PROCESSED' | 'ERROR';
  payload: {
    filteredPoints?: DataPoint[];
    aggregatedPoints?: AggregatedPoint[];
    heatmapBins?: HeatmapBin[];
    processingTimeMs?: number;
    error?: string;
  };
}
