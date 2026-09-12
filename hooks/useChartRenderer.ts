import { useCallback, useEffect, useRef, useState } from 'react';
import { setupCanvasDPI } from '../lib/canvasUtils';
import { ChartMargin, ViewTransform } from '../lib/types';

interface UseChartRendererOptions {
  margin?: ChartMargin;
  onDraw?: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    transform: ViewTransform
  ) => void;
}

export function useChartRenderer({
  margin = { top: 30, right: 30, bottom: 40, left: 60 },
  onDraw,
}: UseChartRendererOptions = {}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 400,
  });

  // Mutable Transform State (bypasses React state to maintain 60 FPS during Pan/Zoom)
  const transformRef = useRef<ViewTransform>({
    scaleX: 1,
    scaleY: 1,
    offsetX: 0,
    offsetY: 0,
  });

  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animFrameIdRef = useRef<number | null>(null);

  // Hover state for interactive tooltips
  const [hoverPosition, setHoverPosition] = useState<{
    px: number;
    py: number;
    show: boolean;
  }>({ px: 0, py: 0, show: false });

  // Handle Container Resizing via ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];
      const newWidth = Math.floor(entry.contentRect.width);
      const newHeight = Math.floor(entry.contentRect.height);

      if (newWidth > 0 && newHeight > 0) {
        setDimensions({ width: newWidth, height: newHeight });
      }
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Main Canvas Render Loop (rAF)
  const renderFrame = useCallback(() => {
    if (!canvasRef.current || !onDraw) return;

    const canvas = canvasRef.current;
    const { width, height } = dimensions;

    const setup = setupCanvasDPI(canvas, width, height);
    if (!setup) return;

    const { ctx } = setup;
    ctx.clearRect(0, 0, width, height);

    // Call chart draw callback with transform
    onDraw(ctx, width, height, transformRef.current);
  }, [dimensions, onDraw]);

  // Request Animation Frame sync
  useEffect(() => {
    const loop = () => {
      renderFrame();
      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [renderFrame]);

  // Mouse & Touch Pan/Zoom Handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX - transformRef.current.offsetX,
      y: e.clientY - transformRef.current.offsetY,
    };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      setHoverPosition({ px, py, show: true });

      if (isDraggingRef.current) {
        transformRef.current.offsetX = e.clientX - dragStartRef.current.x;
        transformRef.current.offsetY = e.clientY - dragStartRef.current.y;
      }
    },
    []
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDraggingRef.current = false;
    setHoverPosition((prev) => ({ ...prev, show: false }));
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const currentScale = transformRef.current.scaleX;
    const newScale = Math.max(0.5, Math.min(20, currentScale * zoomFactor));

    transformRef.current.scaleX = newScale;
    transformRef.current.scaleY = newScale;
  }, []);

  const resetView = useCallback(() => {
    transformRef.current = {
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
    };
  }, []);

  return {
    canvasRef,
    containerRef,
    dimensions,
    margin,
    transformRef,
    hoverPosition,
    resetView,
    mouseHandlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
      onWheel: handleWheel,
    },
  };
}
