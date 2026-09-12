import { CategoryType, DataPoint, DataPointMetadata } from './types';

const CATEGORIES: CategoryType[] = ['alpha', 'beta', 'gamma', 'delta'];
const LOCATIONS = ['Node-US-East', 'Node-EU-West', 'Node-AP-East', 'Node-SA-East'];
const SOURCES = ['Sensor-Array-A', 'Sensor-Array-B', 'Telemetry-Core', 'Edge-Gateway'];

let globalSequence = 0;

/**
 * Generates realistic metadata for a data point.
 */
function createMetadata(sensorId: number, value: number): DataPointMetadata {
  let status: DataPointMetadata['status'] = 'normal';
  if (Math.abs(value) > 85) {
    status = 'critical';
  } else if (Math.abs(value) > 60) {
    status = 'warning';
  }

  return {
    source: SOURCES[sensorId % SOURCES.length],
    status,
    location: LOCATIONS[sensorId % LOCATIONS.length],
    sensorId,
  };
}

/**
 * Creates a single realistic data point.
 */
export function generateSinglePoint(
  timestamp: number,
  prevValue: number = 50,
  sensorId: number = 0
): DataPoint {
  globalSequence++;
  const category = CATEGORIES[globalSequence % CATEGORIES.length];

  // Sine wave background + random walk noise
  const sineWave = Math.sin(timestamp / 5000) * 30;
  const noise = (Math.random() - 0.48) * 8;
  const trend = Math.cos(timestamp / 20000) * 15;
  const value = Math.max(-100, Math.min(100, prevValue * 0.1 + sineWave + noise + trend));
  
  // Secondary value for 2D Scatter/Heatmap
  const secondaryValue = Math.max(-100, Math.min(100, Math.sin(timestamp / 3000) * 40 + (Math.random() - 0.5) * 20));

  return {
    id: `dp_${globalSequence}_${timestamp}`,
    timestamp,
    value: Number(value.toFixed(2)),
    secondaryValue: Number(secondaryValue.toFixed(2)),
    category,
    metadata: createMetadata(sensorId, value),
  };
}

/**
 * Generates an initial seed dataset of specified size.
 * Uses historical timestamps counting backwards from now.
 */
export function generateInitialDataset(count: number): DataPoint[] {
  const points: DataPoint[] = new Array(count);
  const now = Date.now();
  const timeStepMs = 100; // 100ms intervals between points
  let currentVal = 20;

  for (let i = 0; i < count; i++) {
    const timestamp = now - (count - i) * timeStepMs;
    const point = generateSinglePoint(timestamp, currentVal, i);
    currentVal = point.value;
    points[i] = point;
  }

  return points;
}

/**
 * Generates a batch of new streaming points for continuous real-time updates.
 */
export function generateStreamingBatch(batchSize: number, lastPoint?: DataPoint): DataPoint[] {
  const batch: DataPoint[] = new Array(batchSize);
  const now = Date.now();
  let prevVal = lastPoint ? lastPoint.value : 20;

  for (let i = 0; i < batchSize; i++) {
    const timestamp = now - (batchSize - 1 - i) * 10; // offset slightly for burst
    const point = generateSinglePoint(timestamp, prevVal, i);
    prevVal = point.value;
    batch[i] = point;
  }

  return batch;
}
