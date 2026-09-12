import { useCallback, useMemo, useState } from 'react';

interface UseVirtualizationOptions {
  totalItems: number;
  rowHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualization({
  totalItems,
  rowHeight,
  containerHeight,
  overscan = 5,
}: UseVirtualizationOptions) {
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = totalItems * rowHeight;

  const { startIndex, endIndex, paddingTop } = useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / rowHeight);
    const rawStartIndex = Math.floor(scrollTop / rowHeight);

    const start = Math.max(0, rawStartIndex - overscan);
    const end = Math.min(totalItems, rawStartIndex + visibleCount + overscan);

    const topPad = start * rowHeight;

    return {
      startIndex: start,
      endIndex: end,
      paddingTop: topPad,
    };
  }, [scrollTop, totalItems, rowHeight, containerHeight, overscan]);

  const virtualIndices = useMemo(() => {
    const indices: number[] = [];
    for (let i = startIndex; i < endIndex; i++) {
      indices.push(i);
    }
    return indices;
  }, [startIndex, endIndex]);

  return {
    virtualIndices,
    totalHeight,
    paddingTop,
    onScroll: handleScroll,
    startIndex,
    endIndex,
  };
}
