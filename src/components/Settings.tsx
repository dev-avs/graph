import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { ThemeId } from '../types';
import { ThemeVars, THEMES } from '../themes';

interface Props {
  theme: ThemeVars;
  themeId: ThemeId;
  showMarkers: boolean;
  showGrid: boolean;
  thickLines: boolean;
  onThemeChange: (id: ThemeId) => void;
  onMarkersChange: (v: boolean) => void;
  onGridChange: (v: boolean) => void;
  onThickLinesChange: (v: boolean) => void;
}

const THEME_GROUPS: { label: string; ids: ThemeId[] }[] = [
  { label: 'Dark',  ids: ['mocha', 'nord', 'dracula', 'sakuradark'] },
  { label: 'Light', ids: ['latte', 'sakura'] },
];

const MARKER_LEGEND = [
  { color: '#89b4fa', label: 'X-intercepts (zeros)' },
  { color: '#f5c2e7', label: 'Y-intercept' },
  { color: '#a6e3a1', label: 'Local maximum' },
  { color: '#f38ba8', label: 'Local minimum' },
];

const ChevronDown = React.memo(({ size = 14, color }: { size?: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 8 11 13 6" />
  </svg>
));

interface DropdownProps {
  themeId: ThemeId;
  theme: ThemeVars;
  onChange: (id: ThemeId) => void;
}

function ThemeDropdown({ themeId, theme, onChange }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const current = useMemo(() => THEMES[themeId], [themeId]);

  const openDropdown = useCallback(() => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: r.width });
      setOpen(true);
    }
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setPos(null);
  }, []);

  const handleSelect = useCallback((id: ThemeId) => {
    onChange(id);
    close();
  }, [onChange, close]);

  // Outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !listRef.current?.contains(e.target as Node)
      ) close();
    };
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 60);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [open, close]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, close]);

  return (
    <>
      <button
        ref={triggerRef}
        onClick={open ? close : openDropdown}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '9px 12px',
          background: theme.surface,
          border: `1.5px solid ${open ? theme.accent : theme.border}`,
          borderRadius: 9,
          cursor: 'pointer',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: open ? `0 0 0 3px ${theme.accent}28` : 'none',
          textAlign: 'left',
          fontFamily: 'inherit',
          fontSize: 'inherit',
        }}
      >
        <div style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: `conic-gradient(${current.bg} 0deg 120deg, ${current.accent} 120deg 240deg, ${current.text} 240deg 360deg)`,
          border: '1.5px solid rgba(128,128,128,0.22)',
          flexShrink: 0,
        }} />
        <span style={{ flex: 1, color: theme.text, fontSize: 13, fontWeight: 500 }}>
          {current.name}
        </span>
        <span style={{
          transition: 'transform 0.2s',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          display: 'flex',
        }}>
          <ChevronDown color={theme.overlay} />
        </span>
      </button>

      {open && pos && ReactDOM.createPortal(
        <div
          ref={listRef}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            width: pos.width,
            background: theme.bg,
            border: `1.5px solid ${theme.border}`,
            borderRadius: 10,
            boxShadow: theme.isDark
              ? '0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)'
              : '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
            zIndex: 9999,
            overflow: 'hidden',
            maxHeight: Math.min(360, window.innerHeight - pos.top - 12),
            overflowY: 'auto',
          }}
        >
          {THEME_GROUPS.map((group, gi) => (
            <div key={group.label}>
              <div style={{
                padding: '7px 12px 4px',
                fontSize: 10,
                fontWeight: 700,
                color: theme.overlay,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                background: theme.surface + 'cc',
                borderTop: gi > 0 ? `1px solid ${theme.border}` : 'none',
              }}>
                <span style={{
                  display: 'inline-block',
                  width: 6, height: 6, borderRadius: '50%',
                  background: group.label === 'Dark' ? theme.overlay : theme.accent,
                  marginRight: 6,
                  flexShrink: 0,
                }} />
                {group.label}
              </div>

              {group.ids.map((id, itemIdx) => {
                const t = THEMES[id];
                const active = id === themeId;
                const isLast = itemIdx === group.ids.length - 1 && gi === THEME_GROUPS.length - 1;

                return (
                  <ThemeOption
                    key={id}
                    id={id}
                    t={t}
                    active={active}
                    theme={theme}
                    isLast={isLast}
                    onSelect={() => handleSelect(id)}
                  />
                );
              })}
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

interface ThemeOptionProps {
  id: ThemeId;
  t: ThemeVars;
  active: boolean;
  theme: ThemeVars;
  isLast: boolean;
  onSelect: () => void;
}

const ThemeOption = React.memo(function ThemeOption({ t, active, theme, isLast, onSelect }: ThemeOptionProps) {
  const [hov, setHov] = useState(false);

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 12px',
        background: active
          ? theme.accent + '18'
          : hov
          ? theme.surface
          : 'transparent',
        border: 'none',
        borderBottom: isLast ? 'none' : `1px solid ${theme.border}`,
        cursor: 'pointer',
        transition: 'background 0.12s',
        textAlign: 'left',
        fontFamily: 'inherit',
        fontSize: 'inherit',
      }}
    >
      <div style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: `conic-gradient(${t.bg} 0deg 120deg, ${t.accent} 120deg 240deg, ${t.text} 240deg 360deg)`,
        border: '1.5px solid rgba(128,128,128,0.22)',
        flexShrink: 0,
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: active ? theme.accent : theme.text,
          fontSize: 13,
          fontWeight: active ? 600 : 400,
          lineHeight: 1.2,
        }}>
          {t.name}
        </div>
        <div style={{
          color: theme.overlay,
          fontSize: 10,
          marginTop: 1,
          letterSpacing: 0.2,
        }}>
          {t.isDark ? 'Dark' : 'Light'}
        </div>
      </div>

      <div style={{
        width: 18, height: 18,
        borderRadius: '50%',
        background: active ? theme.accent : 'transparent',
        border: `1.5px solid ${active ? theme.accent : theme.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.15s',
      }}>
        {active && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1.5 5 4 7.5 8.5 2.5" />
          </svg>
        )}
      </div>
    </button>
  );
});

export default function Settings({ theme, themeId, showMarkers, showGrid, thickLines, onThemeChange, onMarkersChange, onGridChange, onThickLinesChange }: Props) {
  const sectionLabel = useMemo<React.CSSProperties>(() => ({
    fontSize: 10,
    fontWeight: 700,
    color: theme.overlay,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 8,
  }), [theme.overlay]);

  const handleMarkersChange = useCallback(() => {
    onMarkersChange(!showMarkers);
  }, [showMarkers, onMarkersChange]);

  return (
    <div style={{
      flex: 1, overflowY: 'auto',
      padding: 14,
      display: 'flex', flexDirection: 'column', gap: 20,
    }}>

      <div>
        <div style={sectionLabel}>Theme</div>
        <ThemeDropdown themeId={themeId} theme={theme} onChange={onThemeChange} />
      </div>

      <div>
        <div style={sectionLabel}>Graph Options</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ToggleOption
            label="Key Point Markers"
            desc="Zeros, intercepts, extrema"
            value={showMarkers}
            onChange={onMarkersChange}
            theme={theme}
          />
          <ToggleOption
            label="Show Grid"
            desc="Display background grid"
            value={showGrid}
            onChange={onGridChange}
            theme={theme}
          />
          <ToggleOption
            label="Thick Lines"
            desc="Bolder function curves"
            value={thickLines}
            onChange={onThickLinesChange}
            theme={theme}
          />
        </div>
      </div>

      <div>
        <div style={sectionLabel}>Marker Legend</div>
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 7,
          padding: '10px 12px',
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 9,
        }}>
          {MARKER_LEGEND.map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{
                width: 11, height: 11, borderRadius: '50%',
                background: item.color + '55',
                border: `2px solid ${item.color}`,
                flexShrink: 0,
              }} />
              <span style={{ color: theme.subtext, fontSize: 12 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
