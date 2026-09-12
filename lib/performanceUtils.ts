import { PerformanceMetrics } from './types';

export interface PerformanceMemoryInfo {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}

declare global {
  interface Performance {
    memory?: PerformanceMemoryInfo;
  }
}

/**
 * Utility to safely fetch JS Heap Memory if supported by browser.
 */
export function getMemoryMetrics(): {
  usedMB: number | null;
  limitMB: number | null;
  isSupported: boolean;
} {
  if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
    const mem = window.performance.memory;
    return {
      usedMB: Number((mem.usedJSHeapSize / (1024 * 1024)).toFixed(1)),
      limitMB: Number((mem.jsHeapSizeLimit / (1024 * 1024)).toFixed(1)),
      isSupported: true,
    };
  }

  return {
    usedMB: null,
    limitMB: null,
    isSupported: false,
  };
}

/**
 * FPS Rolling Tracker for smooth empirical frame rate calculation.
 */
export class FrameRateTracker {
  private frameTimes: number[] = [];
  private lastTimestamp: number = 0;
  private maxSamples: number = 60;

  public reset(): void {
    this.frameTimes = [];
    this.lastTimestamp = 0;
  }

  public tick(timestamp: number): number {
    if (this.lastTimestamp === 0) {
      this.lastTimestamp = timestamp;
      return 60;
    }

    const delta = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    if (delta > 0) {
      this.frameTimes.push(1000 / delta);
      if (this.frameTimes.length > this.maxSamples) {
        this.frameTimes.shift();
      }
    }

    if (this.frameTimes.length === 0) return 60;
    const sum = this.frameTimes.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / this.frameTimes.length);
  }
}

/**
 * Formats large point count numbers (e.g. 100000 -> 100,000)
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}
