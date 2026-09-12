import { useCallback, useEffect, useRef, useState } from 'react';
import { generateInitialDataset, generateStreamingBatch } from '../lib/dataGenerator';
import { AggregatedPoint, AggregationInterval, DataPoint, FilterOptions } from '../lib/types';

interface UseDataStreamOptions {
  initialPointCount?: number;
  maxWindowSize?: number;
  streamIntervalMs?: number;
  batchSize?: number;
}

export function useDataStream({
  initialPointCount = 10000,
  maxWindowSize = 100000,
  streamIntervalMs = 100,
  batchSize = 5,
}: UseDataStreamOptions = {}) {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [filteredPoints, setFilteredPoints] = useState<DataPoint[]>([]);
  const [aggregatedPoints, setAggregatedPoints] = useState<AggregatedPoint[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [isStressTesting, setIsStressTesting] = useState<boolean>(false);
  const [processingTimeMs, setProcessingTimeMs] = useState<number>(0);
  const [targetWorkload, setTargetWorkload] = useState<number>(initialPointCount);

  // Active filters and aggregation interval
  const [filters, setFilters] = useState<FilterOptions>({
    categories: ['alpha', 'beta', 'gamma', 'delta'],
    valueRange: [-100, 100],
    timeWindowMs: null,
    searchQuery: '',
  });
  const [aggregationInterval, setAggregationInterval] = useState<AggregationInterval>('raw');

  // Refs for current mutable state during worker messaging
  const dataPointsRef = useRef<DataPoint[]>([]);
  const workerRef = useRef<Worker | null>(null);
  const isWorkerSupportedRef = useRef<boolean>(true);

  // Synchronize ref with state
  dataPointsRef.current = dataPoints;

  // Initialize dataset when target Workload changes
  const resetDataset = useCallback((count: number) => {
    const seed = generateInitialDataset(count);
    dataPointsRef.current = seed;
    setDataPoints(seed);
    setFilteredPoints(seed);
    setTargetWorkload(count);
  }, []);

  // Web Worker Initialization
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Worker) {
      try {
        const worker = new Worker('/workers/dataWorker.js');

        worker.onmessage = (e) => {
          const { type, payload } = e.data;
          if (type === 'PROCESSED') {
            if (payload.filteredPoints) setFilteredPoints(payload.filteredPoints);
            if (payload.aggregatedPoints) setAggregatedPoints(payload.aggregatedPoints);
            if (payload.processingTimeMs !== undefined) setProcessingTimeMs(payload.processingTimeMs);
          }
        };

        worker.onerror = (err) => {
          console.warn('Data Web Worker encountered error, using main thread fallback:', err);
          isWorkerSupportedRef.current = false;
        };

        workerRef.current = worker;
      } catch (err) {
        console.warn('Web Worker initialization failed, using main thread fallback:', err);
        isWorkerSupportedRef.current = false;
      }
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Trigger processing (Web Worker or Main Thread fallback)
  const dispatchProcessing = useCallback(
    (currentPoints: DataPoint[]) => {
      const startTime = performance.now();

      if (workerRef.current && isWorkerSupportedRef.current) {
        workerRef.current.postMessage({
          action: 'PROCESS_DATA',
          payload: {
            dataPoints: currentPoints,
            filters,
            aggregationInterval,
            maxWindowSize: targetWorkload,
          },
        });
      } else {
        // Main thread fallback processing
        let processed = currentPoints;
        if (processed.length > targetWorkload) {
          processed = processed.slice(processed.length - targetWorkload);
        }

        // Apply filters
        if (filters) {
          processed = processed.filter((pt) => {
            if (filters.categories.length > 0 && !filters.categories.includes(pt.category)) return false;
            if (pt.value < filters.valueRange[0] || pt.value > filters.valueRange[1]) return false;
            if (filters.searchQuery.trim() !== '') {
              const q = filters.searchQuery.toLowerCase();
              if (
                !pt.id.toLowerCase().includes(q) &&
                !pt.metadata.source.toLowerCase().includes(q) &&
                !pt.metadata.location.toLowerCase().includes(q)
              ) {
                return false;
              }
            }
            return true;
          });
        }

        // Apply Time Aggregation if requested
        if (aggregationInterval && aggregationInterval !== 'raw') {
          let bucketMs = 60000;
          if (aggregationInterval === '5m') bucketMs = 300000;
          if (aggregationInterval === '1h') bucketMs = 3600000;

          const buckets = new Map<number, { timestamp: number; sum: number; count: number; maxVal: number }>();
          for (let i = 0; i < processed.length; i++) {
            const pt = processed[i];
            const bKey = Math.floor(pt.timestamp / bucketMs) * bucketMs;
            if (!buckets.has(bKey)) {
              buckets.set(bKey, { timestamp: bKey, sum: pt.value, count: 1, maxVal: pt.secondaryValue });
            } else {
              const b = buckets.get(bKey)!;
              b.sum += pt.value;
              b.count++;
              if (pt.secondaryValue > b.maxVal) b.maxVal = pt.secondaryValue;
            }
          }

          processed = Array.from(buckets.values()).map((b, idx) => ({
            id: `agg_${b.timestamp}_${idx}`,
            timestamp: b.timestamp,
            value: Number((b.sum / b.count).toFixed(2)),
            secondaryValue: b.maxVal,
            category: 'alpha' as const,
            metadata: {
              source: `Bucket (${b.count} pts)`,
              status: 'normal' as const,
              location: 'Aggregated-Summary',
              sensorId: 0,
            },
          }));
        }

        setFilteredPoints(processed);
        setProcessingTimeMs(Number((performance.now() - startTime).toFixed(2)));
      }
    },
    [filters, aggregationInterval, targetWorkload]
  );

  // Initial load
  useEffect(() => {
    resetDataset(initialPointCount);
  }, [initialPointCount, resetDataset]);

  // Re-process when filters, aggregation, or workload changes
  useEffect(() => {
    if (dataPointsRef.current.length > 0) {
      dispatchProcessing(dataPointsRef.current);
    }
  }, [filters, aggregationInterval, targetWorkload, dispatchProcessing]);

  // Real-time data streaming loop (setInterval 100ms)
  useEffect(() => {
    if (!isStreaming) return;

    const intervalTime = isStressTesting ? 30 : streamIntervalMs;
    const currentBatchSize = isStressTesting ? batchSize * 5 : batchSize;

    const timer = setInterval(() => {
      const prevPoints = dataPointsRef.current;
      const lastPoint = prevPoints.length > 0 ? prevPoints[prevPoints.length - 1] : undefined;
      const newBatch = generateStreamingBatch(currentBatchSize, lastPoint);

      // Maintain Bounded Sliding Window
      const updatedWindow = [...prevPoints, ...newBatch];
      const maxAllowed = isStressTesting ? Math.min(targetWorkload * 1.5, maxWindowSize) : targetWorkload;

      const boundedWindow =
        updatedWindow.length > maxAllowed
          ? updatedWindow.slice(updatedWindow.length - maxAllowed)
          : updatedWindow;

      dataPointsRef.current = boundedWindow;
      setDataPoints(boundedWindow);

      // Dispatch to worker
      dispatchProcessing(boundedWindow);
    }, intervalTime);

    return () => {
      clearInterval(timer);
    };
  }, [isStreaming, isStressTesting, streamIntervalMs, batchSize, targetWorkload, maxWindowSize, dispatchProcessing]);

  return {
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
  };
}
