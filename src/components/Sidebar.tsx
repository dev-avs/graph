import React, { useState } from 'react';
import { Equation, ThemeId } from '../types';
import { ThemeVars } from '../themes';
import EquationItem from './EquationItem';
import Settings from './Settings';
import TableView from './TableView';

interface Props {
  equations: Equation[];
  theme: ThemeVars;
  themeId: ThemeId;
  showMarkers: boolean;
  showGrid: boolean;
  thickLines: boolean;
  onThemeChange: (id: ThemeId) => void;
  onMarkersChange: (v: boolean) => void;
  onGridChange: (v: boolean) => void;
  onThickLinesChange: (v: boolean) => void;
  onAddEquation: () => void;
  onChangeExpr: (id: number, expr: string) => void;
  onToggleVisible: (id: number) => void;
  onDelete: (id: number) => void;
  onColorChange: (id: number, color: string) => void;
  lastAddedId: number | null;
}

type Tab = 'equations' | 'table' | 'settings';

const GraphLogo = ({ accent }: { accent: string }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="9" fill={accent} fillOpacity="0.18" />
    {/* faint grid */}
    <line x1="16" y1="5" x2="16" y2="27" stroke={accent} strokeWidth="1" strokeOpacity="0.3" />
    <line x1="5" y1="16" x2="27" y2="16" stroke={accent} strokeWidth="1" strokeOpacity="0.3" />
    {/* curve */}
    <path d="M6 16 C9 16 9 8 13 8 C17 8 17 24 21 24 C24 24 24 16 27 13"
      stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* dot at start */}
    <circle cx="6" cy="16" r="1.5" fill={accent} fillOpacity="0.6" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="8" y1="2" x2="8" y2="14" />
    <line x1="2" y1="8" x2="14" y2="8" />
  </svg>
);

const FnIcon = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M3 13 C3 13 4 10 4 8 C4 6 3 3 3 3" />
    <path d="M3 8 L6 8" />
    <path d="M9 6 C9 4.5 10 4 11 4 C12.5 4 13 5 13 6.5 C13 9 11 10 9 12 L13.5 12" />
  </svg>
);

const TableIcon = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1.5" y="2.5" width="13" height="11" rx="2" />
    <line x1="1.5" y1="6" x2="14.5" y2="6" />
    <line x1="6" y1="6" x2="6" y2="13.5" />
  </svg>
);

const GearIcon = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="2.2" />
    <path d="M8 1.5v1.3M8 13.2v1.3M1.5 8h1.3M13.2 8h1.3M3.3 3.3l.9.9M11.8 11.8l.9.9M3.3 12.7l.9-.9M11.8 4.2l.9-.9" />
  </svg>
);


const DraggablePanel = React.memo(({ 
  id, title, icon, defaultX, defaultY, defaultW, defaultH, isOpen, children, 
  theme, glassStyle, zIndex, onFocus, maxHeightOverride 
}: any) => {
  const [pos, setPos] = React.useState(() => {
    try {
      const saved = localStorage.getItem(`spatial_pos_${id}`);
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return { x: defaultX, y: defaultY };
  });

  const [size, setSize] = React.useState(() => {
    try {
      const saved = localStorage.getItem(`spatial_size_${id}`);
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return { w: defaultW || (id === 'table' ? 360 : 320), h: defaultH || 400 };
  });

  const [dragging, setDragging] = React.useState(false);
  const [resizing, setResizing] = React.useState<string | null>(null);
  
  const startMouse = React.useRef({ x: 0, y: 0 });
  const startPos = React.useRef({ x: 0, y: 0 });
  const startSize = React.useRef({ w: 0, h: 0 });

  React.useEffect(() => {
    if (!resizing && !dragging) return;

    const onMove = (e: PointerEvent) => {
      // Safety: if mouse is up but state is somehow active, kill it.
      if (e.buttons !== 1) {
        setResizing(null);
        setDragging(false);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        return;
      }

      if (resizing) {
        // Lock cursor to the resize type
        const cursorMap: any = { n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize', nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize' };
        document.body.style.cursor = cursorMap[resizing] || 'auto';

        const dx = e.clientX - startMouse.current.x;
        const dy = e.clientY - startMouse.current.y;

        let nW = startSize.current.w;
        let nH = startSize.current.h;
        let nX = startPos.current.x;
        let nY = startPos.current.y;

        if (resizing.includes('e')) nW = Math.max(260, startSize.current.w + dx);
        if (resizing.includes('s')) {
          nH = Math.max(160, startSize.current.h + dy);
          if (maxHeightOverride) nH = Math.min(maxHeightOverride, nH);
        }
        
        if (resizing.includes('w')) {
          const dw = startSize.current.w - dx;
          if (dw >= 260) {
            nW = dw;
            nX = startPos.current.x + dx;
          }
        }
        if (resizing.includes('n')) {
          const dh = startSize.current.h - dy;
          if (dh >= 160) {
            nH = dh;
            if (maxHeightOverride) nH = Math.min(maxHeightOverride, nH);
            if (nH <= (maxHeightOverride || 9999)) nY = startPos.current.y + dy;
          }
        }

        setSize({ w: nW, h: nH });
        setPos({ x: nX, y: nY });
      }

      if (dragging) {
        document.body.style.cursor = 'grabbing';
        const nX = e.clientX - startPos.current.x;
        const nY = e.clientY - startPos.current.y;
        setPos({ x: nX, y: nY });
      }
    };

    const onUp = () => {
      setResizing(null);
      setDragging(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    document.body.style.userSelect = 'none';
    
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [resizing, dragging, id, maxHeightOverride]);

  React.useEffect(() => {
    if (!dragging && !resizing) {
      localStorage.setItem(`spatial_pos_${id}`, JSON.stringify(pos));
      localStorage.setItem(`spatial_size_${id}`, JSON.stringify(size));
    }
  }, [pos, size, dragging, resizing, id]);

  if (!isOpen) return null;

  const ResizeHandle = ({ dir, style }: any) => (
    <div 
      onPointerDown={(e) => {
        e.stopPropagation();
        setResizing(dir);
        startMouse.current = { x: e.clientX, y: e.clientY };
        startPos.current = { x: pos.x, y: pos.y };
        startSize.current = { w: size.w, h: size.h };
        onFocus(id);
      }}
      style={{ position: 'absolute', zIndex: 100, ...style }} 
    />
  );

  return (
    <div
      onPointerDown={() => onFocus(id)}
      style={{
        position: 'absolute', top: 0, left: 0,
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        width: size.w,
        height: size.h,
        maxHeight: maxHeightOverride ? `${maxHeightOverride}px` : 'calc(100vh - 32px)',
        zIndex: zIndex,
        background: glassStyle.background,
        backdropFilter: (dragging || resizing) ? 'none' : glassStyle.backdropFilter,
        WebkitBackdropFilter: (dragging || resizing) ? 'none' : glassStyle.WebkitBackdropFilter,
        border: glassStyle.border,
        borderRadius: 16, display: 'flex', flexDirection: 'column',
        pointerEvents: 'auto', overflow: 'hidden',
        willChange: 'transform, width, height',
        boxSizing: 'border-box',
        userSelect: 'none',
        boxShadow: (dragging || resizing)
          ? (theme.isDark ? '0 32px 64px rgba(0,0,0,0.6)' : '0 24px 48px rgba(0,0,0,0.18)') 
          : glassStyle.boxShadow,
      }}
    >
      {/* 8-way resize handles */}
      <ResizeHandle dir="n" style={{ top: 0, left: 10, right: 10, height: 6, cursor: 'ns-resize' }} />
      <ResizeHandle dir="s" style={{ bottom: 0, left: 10, right: 10, height: 6, cursor: 'ns-resize' }} />
      <ResizeHandle dir="e" style={{ right: 0, top: 10, bottom: 10, width: 6, cursor: 'ew-resize' }} />
      <ResizeHandle dir="w" style={{ left: 0, top: 10, bottom: 10, width: 6, cursor: 'ew-resize' }} />
      <ResizeHandle dir="nw" style={{ left: 0, top: 0, width: 12, height: 12, cursor: 'nwse-resize', zIndex: 101 }} />
      <ResizeHandle dir="ne" style={{ right: 0, top: 0, width: 12, height: 12, cursor: 'nesw-resize', zIndex: 101 }} />
      <ResizeHandle dir="sw" style={{ left: 0, bottom: 0, width: 12, height: 12, cursor: 'nesw-resize', zIndex: 101 }} />
      <ResizeHandle dir="se" style={{ right: 0, bottom: 0, width: 12, height: 12, cursor: 'nwse-resize', zIndex: 101 }} />


      <div
        onPointerDown={(e) => {
          e.stopPropagation();
          setDragging(true);
          startPos.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
          onFocus(id);
        }}
        style={{
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8,
          borderBottom: `1px solid ${theme.border}`, cursor: dragging ? 'grabbing' : 'grab',
          userSelect: 'none', background: theme.surface2 + '40', touchAction: 'none',
          flexShrink: 0,
        }}
      >
        <span style={{ color: theme.accent, display: 'flex', pointerEvents: 'none' }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: theme.text, pointerEvents: 'none' }}>{title}</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
});

export default function Sidebar({
  equations, theme, themeId, showMarkers, showGrid, thickLines,
  onThemeChange, onMarkersChange, onGridChange, onThickLinesChange,
  onAddEquation, onChangeExpr, onToggleVisible, onDelete, onColorChange,
  lastAddedId,
}: Props) {
  const [eqOpen, setEqOpen] = useState(() => localStorage.getItem('spatial_open_eq') !== 'false');
  const [tableOpen, setTableOpen] = useState(() => localStorage.getItem('spatial_open_table') === 'true');
  const [settingsOpen, setSettingsOpen] = useState(() => localStorage.getItem('spatial_open_settings') === 'true');
  const [activePanel, setActivePanel] = useState('eq');

  React.useEffect(() => { localStorage.setItem('spatial_open_eq', String(eqOpen)); }, [eqOpen]);
  React.useEffect(() => { localStorage.setItem('spatial_open_table', String(tableOpen)); }, [tableOpen]);
  React.useEffect(() => { localStorage.setItem('spatial_open_settings', String(settingsOpen)); }, [settingsOpen]);

  const defaultRightX = typeof window !== 'undefined' ? window.innerWidth - 380 : 800;

  const glassStyle = {
    background: theme.isDark ? theme.bg + 'cc' : theme.bg + 'd9',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: `1px solid ${theme.isDark ? theme.border : 'rgba(0,0,0,0.08)'}`,
    boxShadow: theme.isDark 
      ? '0 16px 40px rgba(0,0,0,0.5)'
      : '0 12px 32px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.03)',
  };

  const NavBtn = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => {
    const [hov, setHov] = useState(false);
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          padding: '8px 16px',
          borderRadius: 20,
          border: 'none',
          background: active ? (theme.isDark ? theme.text : theme.text) : (hov ? theme.surface2 : 'transparent'),
          color: active ? theme.bg : (hov ? theme.text : theme.subtext),
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: active ? 600 : 500,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          transition: 'all 0.15s ease',
        }}
      >
        <span style={{ color: active ? theme.bg : theme.accent, display: 'flex' }}>{icon}</span>
        {label}
      </button>
    );
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
      
      {/* Top Contextual Menu */}
      <div style={{
        position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)',
        ...glassStyle, borderRadius: 32, display: 'flex', alignItems: 'center',
        padding: 6, gap: 4, pointerEvents: 'auto', zIndex: 1000
      }}>
        <div style={{ padding: '0 16px 0 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ transform: 'scale(0.8)' }}><GraphLogo accent={theme.accent} /></div>
          <span style={{ fontSize: 13, fontWeight: 700, color: theme.text, letterSpacing: -0.2 }}>
            Obsidian
          </span>
        </div>
        <div style={{ width: 1, height: 20, background: theme.border, margin: '0 4px' }} />
        
        <NavBtn active={eqOpen} onClick={() => { setEqOpen(!eqOpen); setActivePanel('eq'); }} icon={<FnIcon />} label="Equations" />
        <div style={{ width: 1, height: 20, background: theme.border, margin: '0 4px' }} />
        <NavBtn active={tableOpen} onClick={() => { setTableOpen(!tableOpen); setActivePanel('table'); }} icon={<TableIcon />} label="Data Grid" />
        <NavBtn active={settingsOpen} onClick={() => { setSettingsOpen(!settingsOpen); setActivePanel('settings'); }} icon={<GearIcon />} label="Settings" />
      </div>

      <DraggablePanel id="eq" title="Equations" icon={<FnIcon />} 
        defaultX={24} defaultY={88} isOpen={eqOpen} theme={theme} glassStyle={glassStyle}
        zIndex={activePanel === 'eq' ? 100 : 10} onFocus={setActivePanel}>
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: 6, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {equations.length === 0 ? (
            <div style={{ padding: '32px 20px', color: theme.overlay, fontSize: 13, textAlign: 'center', lineHeight: 1.6 }}>
              <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.4 }}>f(x)</div>
              No equations yet.<br />Add one below.
            </div>
          ) : (
            <div style={{ flex: 1 }}>
              {equations.map(eq => (
                <EquationItem
                  key={eq.id}
                  eq={eq}
                  theme={theme}
                  onChange={onChangeExpr}
                  onToggleVisible={onToggleVisible}
                  onDelete={onDelete}
                  onColorChange={onColorChange}
                  autoFocus={eq.id === lastAddedId}
                  onEnter={onAddEquation}
                />
              ))}
            </div>
          )}
        </div>
        <div style={{ flexShrink: 0, height: 62, padding: '12px', borderTop: `1px solid ${theme.border}40`, background: theme.surface + '20' }}>
          <AddButton theme={theme} onClick={onAddEquation} />
        </div>
      </DraggablePanel>

      <DraggablePanel id="table" title="Data Grid" icon={<TableIcon />} 
        defaultX={defaultRightX} defaultY={88} isOpen={tableOpen} theme={theme} glassStyle={glassStyle}
        maxHeightOverride={640}
        zIndex={activePanel === 'table' ? 100 : 10} onFocus={setActivePanel}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
           <TableView equations={equations} theme={theme} />
        </div>
      </DraggablePanel>

      <DraggablePanel id="settings" title="Settings" icon={<GearIcon />} 
        defaultX={defaultRightX - 40} defaultY={140} isOpen={settingsOpen} theme={theme} glassStyle={glassStyle}
        zIndex={activePanel === 'settings' ? 100 : 10} onFocus={setActivePanel}>
        <Settings
          theme={theme}
          themeId={themeId}
          showMarkers={showMarkers}
          showGrid={showGrid}
          thickLines={thickLines}
          onThemeChange={onThemeChange}
          onMarkersChange={onMarkersChange}
          onGridChange={onGridChange}
          onThickLinesChange={onThickLinesChange}
        />
      </DraggablePanel>

    </div>
  );
}

function AddButton({ theme, onClick }: { theme: ThemeVars; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%',
        padding: '10px 16px',
        background: hov ? theme.surface2 : theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: 8,
        color: hov ? theme.text : theme.subtext,
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        transition: 'all 0.15s ease',
        letterSpacing: -0.1,
      }}
    >
      <span style={{ color: theme.accent, display: 'flex' }}><PlusIcon /></span>
      Add Equation
    </button>
  );
}
