import { useCallback, useRef, useState } from 'react';
import { FrameRateTracker, getMemoryMetrics } from '../lib/performanceUtils';
import { PerformanceMetrics } from '../lib/types';

export function usePerformanceMonitor() {
  const trackerRef = useRef(new FrameRateTracker());
  const lastMetricsUpdateRef = useRef(0);

  const [metrics, setMetrics] = useState<PerformanceMetrics>(() => {
    const mem = getMemoryMetrics();
    return {
      fps: 60,
      frameTimeMs: 16.6,
      processingTimeMs: 0,
      pointCount: 0,
      memoryHeapUsedMB: mem.usedMB,
      memoryHeapLimitMB: mem.limitMB,
      isMemorySupported: mem.isSupported,
      isStressTesting: false,
      lastUpdateTimestamp: Date.now(),
    };
  });

  const recordFrame = useCallback(
    (
      timestamp: number,
      frameTimeMs: number,
      processingTimeMs: number,
      pointCount: number,
      isStressTesting: boolean
    ) => {
      const currentFps = trackerRef.current.tick(timestamp);

      // Throttle React state updates for the UI performance monitor to ~4 updates/sec (250ms)
      if (timestamp - lastMetricsUpdateRef.current > 250) {
        lastMetricsUpdateRef.current = timestamp;
        const mem = getMemoryMetrics();

        setMetrics({
          fps: currentFps,
          frameTimeMs: Number(frameTimeMs.toFixed(1)),
          processingTimeMs: Number(processingTimeMs.toFixed(1)),
          pointCount,
          memoryHeapUsedMB: mem.usedMB,
          memoryHeapLimitMB: mem.limitMB,
          isMemorySupported: mem.isSupported,
          isStressTesting,
          lastUpdateTimestamp: Date.now(),
        });
      }
    },
    []
  );

  return { metrics, recordFrame };
}
