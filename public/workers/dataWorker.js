// Web Worker for background data filtering, downsampling, and time-series aggregation.

self.onmessage = function (e) {
  const { action, payload } = e.data;
  const startTime = performance.now();

  try {
    if (action === 'PROCESS_DATA') {
      const { dataPoints = [], filters, aggregationInterval, maxWindowSize = 100000 } = payload;

      // 1. Maintain bounded window size
      let processed = dataPoints;
      if (processed.length > maxWindowSize) {
        processed = processed.slice(processed.length - maxWindowSize);
      }

      // 2. Apply Category, Value Range, and Search Filtering
      if (filters) {
        processed = processed.filter((pt) => {
          // Category check
          if (filters.categories && filters.categories.length > 0) {
            if (!filters.categories.includes(pt.category)) return false;
          }
          // Value range check
          if (filters.valueRange) {
            if (pt.value < filters.valueRange[0] || pt.value > filters.valueRange[1]) return false;
          }
          // Search query check
          if (filters.searchQuery && filters.searchQuery.trim() !== '') {
            const query = filters.searchQuery.toLowerCase();
            const matchesId = pt.id.toLowerCase().includes(query);
            const matchesSource = pt.metadata.source.toLowerCase().includes(query);
            const matchesLocation = pt.metadata.location.toLowerCase().includes(query);
            if (!matchesId && !matchesSource && !matchesLocation) return false;
          }
          return true;
        });
      }

      // 3. Apply Time Aggregation (1m, 5m, 1h) if requested
      let aggregated = [];
      if (aggregationInterval && aggregationInterval !== 'raw') {
        aggregated = aggregateTimeSeries(processed, aggregationInterval);
        processed = aggregated.map((agg, idx) => ({
          id: `agg_${agg.timestamp}_${idx}`,
          timestamp: agg.timestamp,
          value: agg.avgValue,
          secondaryValue: agg.maxValue,
          category: 'alpha',
          metadata: {
            source: `Bucket (${agg.count} pts)`,
            status: 'normal',
            location: 'Aggregated-Summary',
            sensorId: 0,
          },
        }));
      }

      const processingTimeMs = Number((performance.now() - startTime).toFixed(2));

      self.postMessage({
        type: 'PROCESSED',
        payload: {
          filteredPoints: processed,
          aggregatedPoints: aggregated,
          processingTimeMs,
        },
      });
    }
  } catch (err) {
    self.postMessage({
      type: 'ERROR',
      payload: {
        error: err.message || 'Worker processing error',
      },
    });
  }
};

/**
 * Aggregates time-series data points into fixed time buckets (1m, 5m, 1h).
 */
function aggregateTimeSeries(points, interval) {
  if (!points || points.length === 0) return [];

  let bucketMs = 60000; // 1 min default
  if (interval === '5m') bucketMs = 300000;
  if (interval === '1h') bucketMs = 3600000;

  const buckets = new Map();

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const bucketKey = Math.floor(pt.timestamp / bucketMs) * bucketMs;

    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, {
        timestamp: bucketKey,
        sum: pt.value,
        minValue: pt.value,
        maxValue: pt.value,
        count: 1,
      });
    } else {
      const b = buckets.get(bucketKey);
      b.sum += pt.value;
      if (pt.value < b.minValue) b.minValue = pt.value;
      if (pt.value > b.maxValue) b.maxValue = pt.value;
      b.count++;
    }
  }

  const result = [];
  buckets.forEach((b) => {
    result.push({
      timestamp: b.timestamp,
      avgValue: Number((b.sum / b.count).toFixed(2)),
      minValue: b.minValue,
      maxValue: b.maxValue,
      count: b.count,
    });
  });

  result.sort((a, b) => a.timestamp - b.timestamp);
  return result;
}
