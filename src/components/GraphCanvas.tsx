import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Equation, View, KeyPoint } from '../types';
import { ThemeVars } from '../themes';
import { findKeyPoints, findIntersections } from '../utils/markers';

interface Props {
  equations: Equation[];
  view: View;
  onViewChange: (v: View) => void;
  theme: ThemeVars;
  showMarkers: boolean;
  showGrid: boolean;
  thickLines: boolean;
}

function mathToScreen(mx: number, my: number, W: number, H: number, v: View) {
  return {
    sx: W / 2 + (mx - v.cx) * v.scale,
    sy: H / 2 - (my - v.cy) * v.scale,
  };
}

function niceStep(raw: number): number {
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / mag;
  const nice = f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10;
  return nice * mag;
}

function fmtLabel(n: number): string {
  if (Math.abs(n) < 1e-9) return '0';
  if (Number.isInteger(n)) return String(n);
  const abs = Math.abs(n);
  if (abs >= 100) return n.toFixed(0);
  if (abs >= 10) return n.toFixed(1);
  return n.toFixed(2);
}

export default function GraphCanvas({ equations, view, onViewChange, theme, showMarkers, showGrid, thickLines }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ sx: number; sy: number; cx: number; cy: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mouseCoords, setMouseCoords] = useState<{ x: number; y: number } | null>(null);
  const [snapPoint, setSnapPoint] = useState<{ x: number; y: number; color: string; label?: string } | null>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [keyPoints, setKeyPoints] = useState<{ eqId: number; pts: KeyPoint[] }[]>([]);

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w;
      canvas.height = h;
      setSize({ w, h });
    });
    ro.observe(canvas);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    setSize({ w: canvas.offsetWidth, h: canvas.offsetHeight });
    return () => ro.disconnect();
  }, []);

  // Debounce key point calculations so they don't lag panning
  useEffect(() => {
    if (!showMarkers) { setKeyPoints([]); return; }
    const visEqs = equations.filter(eq => eq.visible && eq.fn);
    const W = size.w;
    if (W === 0 || view.scale === 0) return;
    const xMin = view.cx - W / (2 * view.scale);
    const xMax = view.cx + W / (2 * view.scale);

    const t = setTimeout(() => {
      const arr: { eqId: number; pts: KeyPoint[] }[] = [];
      
      for (let i = 0; i < visEqs.length; i++) {
        const eq1 = visEqs[i];
        const pts = findKeyPoints(eq1.fn!, eq1.color, xMin, xMax);
        
        // Find intersections with all subsequent equations
        for (let j = i + 1; j < visEqs.length; j++) {
           const eq2 = visEqs[j];
           const interPts = findIntersections(eq1.fn!, eq2.fn!, theme.text, xMin, xMax);
           pts.push(...interPts);
        }
        
        arr.push({ eqId: eq1.id, pts });
      }
      setKeyPoints(arr);
    }, 150);

    return () => clearTimeout(t);
  }, [equations, view, showMarkers, size]);

  const gridCache = useRef<HTMLCanvasElement | null>(null);

  // 1. Grid & Axes Cache (Offscreen)
  useEffect(() => {
    if (!showGrid || size.w === 0 || size.h === 0) { gridCache.current = null; return; }
    
    // We cache a grid that is 3x the size of the screen to allow some panning without redraw
    // But for now, let's just cache the static grid relative to the scale
    const canvas = document.createElement('canvas');
    canvas.width = size.w;
    canvas.height = size.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const xMin = view.cx - size.w / (2 * view.scale);
    const xMax = view.cx + size.w / (2 * view.scale);
    const yMin = view.cy - size.h / (2 * view.scale);
    const yMax = view.cy + size.h / (2 * view.scale);
    const step = niceStep(100 / view.scale);

    ctx.lineWidth = 1;
    ctx.strokeStyle = theme.grid;
    const x0 = Math.ceil(xMin / step) * step;
    const y0 = Math.ceil(yMin / step) * step;

    ctx.beginPath();
    for (let x = x0; x <= xMax + step * 0.01; x += step) {
      const sx = size.w / 2 + (x - view.cx) * view.scale;
      ctx.moveTo(sx, 0); ctx.lineTo(sx, size.h);
    }
    for (let y = y0; y <= yMax + step * 0.01; y += step) {
      const sy = size.h / 2 - (y - view.cy) * view.scale;
      ctx.moveTo(0, sy); ctx.lineTo(size.w, sy);
    }
    ctx.stroke();

    // Axes
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = theme.axis;
    const axY = size.h/2 - (0 - view.cy)*view.scale;
    const axX = size.w/2 + (0 - view.cx)*view.scale;
    ctx.beginPath();
    if (axY >= 0 && axY <= size.h) { ctx.moveTo(0, axY); ctx.lineTo(size.w, axY); }
    if (axX >= 0 && axX <= size.w) { ctx.moveTo(axX, 0); ctx.lineTo(axX, size.h); }
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = theme.label;
    ctx.font = '11px monospace';
    const labelY = Math.min(Math.max(axY + 16, 14), size.h - 4);
    const labelX = Math.max(Math.min(axX - 8, size.w - 40), 4);
    ctx.textAlign = 'center';
    for (let x = x0; x <= xMax + step * 0.01; x += step) {
      if (Math.abs(x) < step * 0.01) continue;
      const sx = size.w / 2 + (x - view.cx) * view.scale;
      ctx.fillText(fmtLabel(x), sx, labelY);
    }
    ctx.textAlign = 'right';
    for (let y = y0; y <= yMax + step * 0.01; y += step) {
      if (Math.abs(y) < step * 0.01) continue;
      const sy = size.h / 2 - (y - view.cy) * view.scale;
      ctx.fillText(fmtLabel(y), labelX, sy + 4);
    }

    gridCache.current = canvas;
  }, [view.scale, theme, showGrid, size, view.cx, view.cy]); 
  // NOTE: including cx/cy in dependency because labels move. 
  // For true ultra-speed, we'd cache just the pattern and draw labels separately.

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    if (W === 0 || H === 0) return;

    ctx.fillStyle = theme.canvasBg;
    ctx.fillRect(0, 0, W, H);

    // 1. Draw Cached Grid
    if (gridCache.current) {
      ctx.drawImage(gridCache.current, 0, 0);
    }

    // 2. Plot functions (Adaptive Sampling)
    ctx.lineWidth = thickLines ? 4.5 : 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const visEqs = equations.filter(eq => eq.visible && eq.fn);
    const stepX = isDragging ? 3 : 1;
    
    for (const eq of visEqs) {
      const fn = eq.fn!;
      ctx.strokeStyle = eq.color;
      ctx.beginPath();
      let pen = false;
      let prevSy = 0;
      for (let px = 0; px <= W; px += stepX) {
        const mx = view.cx + (px - W / 2) / view.scale;
        let my: number;
        try { my = fn(mx); } catch { pen = false; continue; }
        if (!isFinite(my)) { pen = false; continue; }
        const sy = H / 2 - (my - view.cy) * view.scale;
        if (pen && Math.abs(sy - prevSy) > H * 3) pen = false;
        if (!pen) { ctx.moveTo(px, sy); pen = true; }
        else ctx.lineTo(px, sy);
        prevSy = sy;
      }
      ctx.stroke();
    }

    // 3. Markers (Batched by color)
    if (showMarkers && !isDragging) {
      const markerGroups: Record<string, { x: number, y: number }[]> = {};
      
      for (const k of keyPoints) {
        for (const pt of k.pts) {
          const mColor =
            pt.kind === 'intersect' ? theme.text :
            pt.kind === 'zero' ? pt.color :
            pt.kind === 'yint' ? '#f5c2e7' :
            pt.kind === 'max'  ? '#a6e3a1' : '#f38ba8';
          
          if (!markerGroups[mColor]) markerGroups[mColor] = [];
          markerGroups[mColor].push({ x: pt.x, y: pt.y });
        }
      }

      ctx.lineWidth = 1.5;
      for (const [color, pts] of Object.entries(markerGroups)) {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        // Outer rings
        ctx.beginPath();
        for (const pt of pts) {
          const { sx, sy } = mathToScreen(pt.x, pt.y, W, H, view);
          if (sx < -10 || sx > W + 10 || sy < -10 || sy > H + 10) continue;
          ctx.moveTo(sx + 5, sy);
          ctx.arc(sx, sy, 5, 0, Math.PI * 2);
        }
        ctx.stroke();
        // Inner dots
        ctx.beginPath();
        for (const pt of pts) {
          const { sx, sy } = mathToScreen(pt.x, pt.y, W, H, view);
          if (sx < -10 || sx > W + 10 || sy < -10 || sy > H + 10) continue;
          ctx.moveTo(sx + 2.5, sy);
          ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
        }
        ctx.fill();
      }
    }
  }, [equations, view, theme, showMarkers, size, keyPoints, showGrid, thickLines, isDragging]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width, H = canvas.height;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width);
    const my = (e.clientY - rect.top) * (H / rect.height);
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    const newScale = Math.max(2, Math.min(50000, view.scale * factor));
    const ncx = view.cx + (mx - W / 2) / view.scale - (mx - W / 2) / newScale;
    const ncy = view.cy - (my - H / 2) / view.scale + (my - H / 2) / newScale;
    onViewChange({ cx: ncx, cy: ncy, scale: newScale });
  }, [view, onViewChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    dragRef.current = { sx: e.clientX, sy: e.clientY, cx: view.cx, cy: view.cy };
    setIsDragging(true);
    setSnapPoint(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width, H = canvas.height;
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (W / rect.width);
    const py = (e.clientY - rect.top) * (H / rect.height);
    const mx = view.cx + (px - W / 2) / view.scale;
    const my = view.cy - (py - H / 2) / view.scale;

    if (dragRef.current) {
      const dx = e.clientX - dragRef.current.sx;
      const dy = e.clientY - dragRef.current.sy;
      onViewChange({
        ...view,
        cx: dragRef.current.cx - dx / view.scale,
        cy: dragRef.current.cy + dy / view.scale,
      });
      setMouseCoords(null);
      setSnapPoint(null);
    } else {
      setMouseCoords({ x: mx, y: my });

      let bestPixDist = 18; // Snap radius
      let bestPt: any = null;

      // 1. Snap to key points (higher priority)
      if (showMarkers) {
        for (const k of keyPoints) {
          for (const pt of k.pts) {
            const { sx, sy } = mathToScreen(pt.x, pt.y, W, H, view);
            const dist = Math.hypot(sx - px, sy - py);
            if (dist < 15) { // marker snap is tighter
              bestPixDist = dist;
              bestPt = { x: pt.x, y: pt.y, color: pt.color, label: pt.label };
            }
          }
        }
      }

      // 2. Snap to curves
      if (!bestPt) {
        const visEqs = equations.filter(eq => eq.visible && eq.fn);
        for (const eq of visEqs) {
          try {
            const fy = eq.fn!(mx);
            if (isFinite(fy)) {
              const { sx, sy } = mathToScreen(mx, fy, W, H, view);
              const dist = Math.hypot(sx - px, sy - py);
              if (dist < 12) { // curve snap
                bestPixDist = dist;
                bestPt = { x: mx, y: fy, color: eq.color };
              }
            }
          } catch {}
        }
      }

      setSnapPoint(bestPt);
    }
  };

  const handleMouseUp = () => { dragRef.current = null; setIsDragging(false); };
  const handleMouseLeave = () => { dragRef.current = null; setIsDragging(false); setMouseCoords(null); setSnapPoint(null); };

  const zoom = (factor: number) => onViewChange({ ...view, scale: Math.max(2, Math.min(50000, view.scale * factor)) });
  const reset = () => onViewChange({ cx: 0, cy: 0, scale: 80 });

  const glass = theme.isDark
    ? { bg: 'rgba(15,15,25,0.55)', border: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)' }
    : { bg: 'rgba(255,255,255,0.7)', border: 'rgba(0,0,0,0.1)', color: 'rgba(0,0,0,0.6)' };

  const zoomBtns = [
    { label: '+', title: 'Zoom in', onClick: () => zoom(1.4) },
    { label: '⊙', title: 'Reset view', onClick: reset },
    { label: '−', title: 'Zoom out', onClick: () => zoom(1 / 1.4) },
  ];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', cursor: isDragging ? 'grabbing' : 'crosshair' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />

      {/* Snap Marker */}
      {snapPoint && (
        <div style={{
          position: 'absolute',
          left: size.w / 2 + (snapPoint.x - view.cx) * view.scale,
          top: size.h / 2 - (snapPoint.y - view.cy) * view.scale,
          pointerEvents: 'none',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
        }}>
          <div style={{
            width: 14, height: 14, borderRadius: '50%',
            background: snapPoint.color, border: '2.5px solid white',
            boxShadow: '0 0 10px rgba(0,0,0,0.5)'
          }} />
          <div style={{
            position: 'absolute', top: -32, left: '50%', transform: 'translateX(-50%)',
            background: theme.surface, color: theme.text, padding: '4px 8px',
            borderRadius: 6, border: `1px solid ${theme.border}`,
            fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
            boxShadow: theme.isDark ? '0 4px 12px rgba(0,0,0,0.6)' : '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            {snapPoint.label || `(${fmtLabel(snapPoint.x)}, ${fmtLabel(snapPoint.y)})`}
          </div>
        </div>
      )}

      {/* Zoom controls */}
      <div style={{
        position: 'absolute', top: 16, right: 16,
        display: 'flex', flexDirection: 'column',
        borderRadius: 11, overflow: 'hidden',
        border: `1px solid ${glass.border}`,
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        background: glass.bg,
        boxShadow: theme.isDark
          ? '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)'
          : '0 4px 24px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
      }}>
        {zoomBtns.map((btn, i) => (
          <ZoomButton key={btn.label} {...btn} divider={i < zoomBtns.length - 1} glass={glass} />
        ))}
      </div>

      {/* Coord display */}
      {mouseCoords && !snapPoint && (
        <div style={{
          position: 'absolute', bottom: 14, right: 16,
          background: glass.bg, border: `1px solid ${glass.border}`,
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          borderRadius: 7, padding: '4px 10px',
          color: glass.color, fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
          pointerEvents: 'none', letterSpacing: 0.2,
        }}>
          x: {mouseCoords.x.toFixed(3)}&nbsp;&nbsp;y: {mouseCoords.y.toFixed(3)}
        </div>
      )}
    </div>
  );
}

interface ZoomBtnProps {
  label: string; title: string; onClick: () => void; divider: boolean; glass: { bg: string; border: string; color: string };
}
function ZoomButton({ label, title, onClick, divider, glass }: ZoomBtnProps) {
  const [hov, setHov] = React.useState(false);
  return (
    <button
      onClick={onClick} title={title} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: 36, height: 36, background: hov ? 'rgba(128,128,128,0.2)' : 'transparent',
        border: 'none', borderBottom: divider ? `1px solid ${glass.border}` : 'none',
        color: hov ? (glass.color.includes('255') ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.8)') : glass.color,
        cursor: 'pointer', fontSize: label === '⊙' ? 15 : 18,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.12s, color 0.12s', userSelect: 'none', fontWeight: 300,
      }}
    >
      {label}
    </button>
  );
}
