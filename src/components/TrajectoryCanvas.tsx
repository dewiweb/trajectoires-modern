import { useRef, useEffect, useCallback, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { getPointAtTime } from '@shared/trajectory';
import type { Trajectory, Point3D } from '@shared/types';

export function TrajectoryCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawStartTimeRef = useRef<number>(0);
  const lastPointRef = useRef<Point3D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const {
    trajectories,
    currentTrajectoryIndex,
    drawingTrajectory,
    canvasZoom,
    speakerDistance,
    currentZ,
    playbackTime,
    isPlaying,
    startDrawing,
    addDrawingPoint,
    finishDrawing,
    cancelDrawing,
  } = useAppStore();

  const { streamPoint } = useWebSocket();

  // Convert canvas coordinates to normalized coordinates (-1 to 1)
  const canvasToNormalized = useCallback((x: number, y: number): [number, number] => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];
    
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const scale = Math.min(rect.width, rect.height) / 2 * canvasZoom;
    
    return [
      ((x - centerX) / scale) * speakerDistance,
      (-(y - centerY) / scale) * speakerDistance, // Flip Y axis
    ];
  }, [canvasZoom, speakerDistance]);

  // Convert normalized coordinates to canvas coordinates
  const normalizedToCanvas = useCallback((x: number, y: number): [number, number] => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];
    
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const scale = Math.min(rect.width, rect.height) / 2 * canvasZoom;
    
    return [
      centerX + (x / speakerDistance) * scale,
      centerY - (y / speakerDistance) * scale, // Flip Y axis
    ];
  }, [canvasZoom, speakerDistance]);

  // Get pointer position from event
  const getPointerPosition = useCallback((e: React.PointerEvent | PointerEvent): [number, number] => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];
    
    const rect = canvas.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  }, []);

  // Handle pointer down
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return; // Left click only
    
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    
    const [canvasX, canvasY] = getPointerPosition(e);
    const [normX, normY] = canvasToNormalized(canvasX, canvasY);
    
    drawStartTimeRef.current = performance.now();
    lastPointRef.current = { x: normX, y: normY, z: currentZ };
    
    startDrawing(normX, normY, currentZ);
    streamPoint(useAppStore.getState().currentSourceNumber, { x: normX, y: normY, z: currentZ });
    setIsDrawing(true);
  }, [getPointerPosition, canvasToNormalized, currentZ, startDrawing, streamPoint]);

  // Handle pointer move
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawing) return;
    
    const [canvasX, canvasY] = getPointerPosition(e);
    const [normX, normY] = canvasToNormalized(canvasX, canvasY);
    const t = performance.now() - drawStartTimeRef.current;
    
    // Only add point if it's significantly different from last point
    const last = lastPointRef.current;
    if (last) {
      const dist = Math.sqrt(Math.pow(normX - last.x, 2) + Math.pow(normY - last.y, 2));
      if (dist < 0.01) return; // Threshold to avoid too many points
    }
    
    lastPointRef.current = { x: normX, y: normY, z: currentZ };
    addDrawingPoint(normX, normY, currentZ, t);
    streamPoint(useAppStore.getState().currentSourceNumber, { x: normX, y: normY, z: currentZ });
  }, [isDrawing, getPointerPosition, canvasToNormalized, currentZ, addDrawingPoint, streamPoint]);

  // Handle pointer up
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDrawing) return;
    
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDrawing(false);
    finishDrawing();
  }, [isDrawing, finishDrawing]);

  // Handle pointer cancel
  const handlePointerCancel = useCallback(() => {
    setIsDrawing(false);
    cancelDrawing();
  }, [cancelDrawing]);

  // Draw grid
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) / 2 * canvasZoom;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Draw concentric circles
    for (let r = 0.25; r <= speakerDistance; r += 0.25) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (r / speakerDistance) * scale, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Draw cross
    ctx.beginPath();
    ctx.moveTo(centerX - scale, centerY);
    ctx.lineTo(centerX + scale, centerY);
    ctx.moveTo(centerX, centerY - scale);
    ctx.lineTo(centerX, centerY + scale);
    ctx.stroke();
    
    // Draw speaker positions (8 speakers in circle)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * scale;
      const y = centerY + Math.sin(angle) * scale;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [canvasZoom, speakerDistance]);

  // Draw a trajectory
  const drawTrajectory = useCallback((
    ctx: CanvasRenderingContext2D,
    trajectory: Trajectory,
    isSelected: boolean,
    playheadTime?: number
  ) => {
    const { points, color } = trajectory;
    if (points.length < 2) return;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Draw path
    ctx.beginPath();
    const [startX, startY] = normalizedToCanvas(points[0].x, points[0].y);
    ctx.moveTo(startX, startY);
    
    for (let i = 1; i < points.length; i++) {
      const [x, y] = normalizedToCanvas(points[i].x, points[i].y);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Draw start point
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(startX, startY, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw end point
    const lastPoint = points[points.length - 1];
    const [endX, endY] = normalizedToCanvas(lastPoint.x, lastPoint.y);
    ctx.beginPath();
    ctx.arc(endX, endY, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw playhead if playing
    if (playheadTime !== undefined) {
      const point = getPointAtTime(trajectory, playheadTime);
      if (point) {
        const [px, py] = normalizedToCanvas(point.x, point.y);
        
        // Glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Inner white circle
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [normalizedToCanvas]);

  // Main draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    const { width, height } = canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid
    drawGrid(ctx, width, height);
    
    // Draw all trajectories
    trajectories.forEach((trajectory, index) => {
      const isSelected = index === currentTrajectoryIndex;
      const playheadTime = isPlaying && isSelected ? playbackTime : undefined;
      drawTrajectory(ctx, trajectory, isSelected, playheadTime);
    });
    
    // Draw current drawing trajectory
    if (drawingTrajectory && drawingTrajectory.points.length > 0) {
      drawTrajectory(ctx, drawingTrajectory, true);
    }
  }, [trajectories, currentTrajectoryIndex, drawingTrajectory, isPlaying, playbackTime, drawGrid, drawTrajectory]);

  // Resize canvas
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    
    draw();
  }, [draw]);

  // Setup resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);
    
    resizeCanvas();
    
    return () => resizeObserver.disconnect();
  }, [resizeCanvas]);

  // Redraw on state changes
  useEffect(() => {
    draw();
  }, [draw]);

  // Animation loop for playback
  useEffect(() => {
    if (!isPlaying) return;
    
    let animationId: number;
    const animate = () => {
      draw();
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, draw]);

  return (
    <div 
      ref={containerRef} 
      className="canvas-container w-full h-full"
    >
      <canvas
        ref={canvasRef}
        className="touch-none cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}
