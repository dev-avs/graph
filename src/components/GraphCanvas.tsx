import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Equation, View } from '../types';
import { ThemeVars } from '../themes';
import { findKeyPoints } from '../utils/markers';

interface Props {
  equations: Equation[];
  view: View;
  onViewChange: (v: View) => void;
  theme: ThemeVars;
  showMarkers: boolean;
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

export default function GraphCanvas({ equations, view, onViewChange, theme, showMarkers }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ sx: number; sy: number; cx: number; cy: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mouseCoords, setMouseCoords] = useState<{ x: number; y: number } | null>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });

  // Resize observer — keeps canvas pixel dimensions in sync
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

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    if (W === 0 || H === 0) return;

    ctx.fillStyle = theme.canvasBg;
    ctx.fillRect(0, 0, W, H);

    const xMin = view.cx - W / (2 * view.scale);
    const xMax = view.cx + W / (2 * view.scale);
    const yMin = view.cy - H / (2 * view.scale);
    const yMax = view.cy + H / (2 * view.scale);
    const step = niceStep(100 / view.scale);

    // Grid lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = theme.grid;
    const x0 = Math.ceil(xMin / step) * step;
    for (let x = x0; x <= xMax + step * 0.01; x += step) {
      const sx = W / 2 + (x - view.cx) * view.scale;
      ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, H); ctx.stroke();
    }
    const y0 = Math.ceil(yMin / step) * step;
    for (let y = y0; y <= yMax + step * 0.01; y += step) {
      const sy = H / 2 - (y - view.cy) * view.scale;
      ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy); ctx.stroke();
    }

    // Axes
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = theme.axis;
    const axY = H / 2 - (0 - view.cy) * view.scale;
    const axX = W / 2 + (0 - view.cx) * view.scale;
    if (axY >= 0 && axY <= H) {
      ctx.beginPath(); ctx.moveTo(0, axY); ctx.lineTo(W, axY); ctx.stroke();
    }
    if (axX >= 0 && axX <= W) {
      ctx.beginPath(); ctx.moveTo(axX, 0); ctx.lineTo(axX, H); ctx.stroke();
    }

    // Axis labels
    ctx.fillStyle = theme.label;
    ctx.font = '11px monospace';
    const labelY = Math.min(Math.max(axY + 16, 14), H - 4);
    const labelX = Math.max(Math.min(axX - 8, W - 40), 4);
    ctx.textAlign = 'center';
    for (let x = x0; x <= xMax + step * 0.01; x += step) {
      if (Math.abs(x) < step * 0.01) continue;
      const sx = W / 2 + (x - view.cx) * view.scale;
      ctx.fillText(fmtLabel(x), sx, labelY);
    }
    ctx.textAlign = 'right';
    for (let y = y0; y <= yMax + step * 0.01; y += step) {
      if (Math.abs(y) < step * 0.01) continue;
      const sy = H / 2 - (y - view.cy) * view.scale;
      ctx.fillText(fmtLabel(y), labelX, sy + 4);
    }

    // Plot functions
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const visEqs = equations.filter(eq => eq.visible && eq.fn);
    for (const eq of visEqs) {
      const fn = eq.fn!;
      ctx.strokeStyle = eq.color;
      ctx.beginPath();
      let pen = false;
      let prevSy = 0;
      for (let px = 0; px <= W; px++) {
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

    // Key point markers
    if (showMarkers && visEqs.length > 0) {
      for (const eq of visEqs) {
        const pts = findKeyPoints(eq.fn!, eq.color, xMin, xMax);
        for (const pt of pts) {
          const { sx, sy } = mathToScreen(pt.x, pt.y, W, H, view);
          if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) continue;

          // Ring + dot
          const markerColor =
            pt.kind === 'zero' ? eq.color :
            pt.kind === 'yint' ? '#f5c2e7' :
            pt.kind === 'max'  ? '#a6e3a1' : '#f38ba8';

          ctx.beginPath();
          ctx.arc(sx, sy, 6, 0, Math.PI * 2);
          ctx.strokeStyle = markerColor;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(sx, sy, 3, 0, Math.PI * 2);
          ctx.fillStyle = markerColor;
          ctx.fill();

          // Label with translucent background
          const label = pt.label;
          ctx.font = 'bold 11px monospace';
          const tw = ctx.measureText(label).width;
          const lx = sx + 10;
          const ly = sy - 8;
          ctx.fillStyle = theme.canvasBg + 'cc';
          ctx.fillRect(lx - 2, ly - 11, tw + 6, 15);
          ctx.fillStyle = theme.label;
          ctx.textAlign = 'left';
          ctx.fillText(label, lx, ly);
        }
      }
    }
  }, [equations, view, theme, showMarkers, size]);

  // Wheel zoom (passive: false to allow preventDefault)
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
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width, H = canvas.height;
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (W / rect.width);
    const py = (e.clientY - rect.top) * (H / rect.height);
    setMouseCoords({
      x: view.cx + (px - W / 2) / view.scale,
      y: view.cy - (py - H / 2) / view.scale,
    });
    if (dragRef.current) {
      const dx = e.clientX - dragRef.current.sx;
      const dy = e.clientY - dragRef.current.sy;
      onViewChange({
        ...view,
        cx: dragRef.current.cx - dx / view.scale,
        cy: dragRef.current.cy + dy / view.scale,
      });
    }
  };

  const handleMouseUp = () => { dragRef.current = null; setIsDragging(false); };
  const handleMouseLeave = () => { dragRef.current = null; setIsDragging(false); setMouseCoords(null); };

  const zoom = (factor: number) => {
    onViewChange({ ...view, scale: Math.max(2, Math.min(50000, view.scale * factor)) });
  };
  const reset = () => onViewChange({ cx: 0, cy: 0, scale: 80 });

  const glass = theme.isDark
    ? { bg: 'rgba(15,15,25,0.55)', border: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)' }
    : { bg: 'rgba(255,255,255,0.7)', border: 'rgba(0,0,0,0.1)', color: 'rgba(0,0,0,0.6)' };

  const zoomBtns = [
    { label: '+', title: 'Zoom in', action: () => zoom(1.4) },
    { label: '⊙', title: 'Reset view', action: reset },
    { label: '−', title: 'Zoom out', action: () => zoom(1 / 1.4) },
  ];

  return (
    <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', cursor: isDragging ? 'grabbing' : 'crosshair' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />

      {/* Zoom controls — glass panel */}
      <div style={{
        position: 'absolute', top: 16, right: 16,
        display: 'flex', flexDirection: 'column',
        borderRadius: 11,
        overflow: 'hidden',
        border: `1px solid ${glass.border}`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        background: glass.bg,
        boxShadow: theme.isDark
          ? '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)'
          : '0 4px 24px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
      }}>
        {zoomBtns.map((btn, i) => (
          <ZoomButton
            key={btn.label}
            label={btn.label}
            title={btn.title}
            onClick={btn.action}
            divider={i < zoomBtns.length - 1}
            glass={glass}
          />
        ))}
      </div>

      {/* Coord display */}
      {mouseCoords && (
        <div style={{
          position: 'absolute', bottom: 14, right: 16,
          background: glass.bg,
          border: `1px solid ${glass.border}`,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: 7,
          padding: '4px 10px',
          color: glass.color,
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          pointerEvents: 'none',
          letterSpacing: 0.2,
        }}>
          x: {mouseCoords.x.toFixed(3)}&nbsp;&nbsp;y: {mouseCoords.y.toFixed(3)}
        </div>
      )}
    </div>
  );
}

interface ZoomBtnProps {
  label: string;
  title: string;
  onClick: () => void;
  divider: boolean;
  glass: { bg: string; border: string; color: string };
}

function ZoomButton({ label, title, onClick, divider, glass }: ZoomBtnProps) {
  const [hov, setHov] = React.useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 36, height: 36,
        background: hov ? 'rgba(128,128,128,0.2)' : 'transparent',
        border: 'none',
        borderBottom: divider ? `1px solid ${glass.border}` : 'none',
        color: hov ? (glass.color.includes('255') ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.8)') : glass.color,
        cursor: 'pointer',
        fontSize: label === '⊙' ? 15 : 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.12s, color 0.12s',
        userSelect: 'none',
        fontWeight: 300,
      }}
    >
      {label}
    </button>
  );
}
