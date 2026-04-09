import React from 'react';
import { ThemeId } from '../types';
import { ThemeVars, THEMES } from '../themes';

interface Props {
  theme: ThemeVars;
  themeId: ThemeId;
  showMarkers: boolean;
  onThemeChange: (id: ThemeId) => void;
  onMarkersChange: (v: boolean) => void;
}

export default function Settings({ theme, themeId, showMarkers, onThemeChange, onMarkersChange }: Props) {
  const sectionLabel: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: theme.subtext,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Theme picker */}
      <div>
        <div style={sectionLabel}>Theme</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(Object.keys(THEMES) as ThemeId[]).map(id => {
            const t = THEMES[id];
            const active = id === themeId;
            return (
              <button
                key={id}
                onClick={() => onThemeChange(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  background: active ? theme.surface : 'transparent',
                  border: `1.5px solid ${active ? theme.subtext : theme.border}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                {/* Color swatches preview */}
                <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                  {[t.bg, t.surface, t.text, t.subtext].map((c, i) => (
                    <div key={i} style={{
                      width: 12, height: 20, borderRadius: 2,
                      background: c,
                      border: '1px solid rgba(0,0,0,0.2)',
                    }} />
                  ))}
                </div>
                <span style={{ color: theme.text, fontSize: 13, fontWeight: active ? 600 : 400, flex: 1 }}>
                  {t.name}
                </span>
                {active && <span style={{ color: theme.subtext, fontSize: 14 }}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Graph options */}
      <div>
        <div style={sectionLabel}>Graph Options</div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
        }}>
          <div>
            <div style={{ color: theme.text, fontSize: 13, fontWeight: 500 }}>Key Point Markers</div>
            <div style={{ color: theme.subtext, fontSize: 11, marginTop: 2 }}>
              Zeros, intercepts, extrema
            </div>
          </div>
          {/* Toggle switch */}
          <button
            onClick={() => onMarkersChange(!showMarkers)}
            style={{
              width: 44, height: 24, borderRadius: 12,
              background: showMarkers ? '#a6e3a1' : theme.surface2,
              border: 'none', cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}
          >
            <div style={{
              position: 'absolute',
              top: 3,
              left: showMarkers ? 23 : 3,
              width: 18, height: 18,
              borderRadius: 9,
              background: 'white',
              transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div>
        <div style={sectionLabel}>Marker Legend</div>
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 6,
          padding: '10px 12px',
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          fontSize: 12,
        }}>
          {[
            { color: '#89b4fa', label: 'X-intercepts (zeros)' },
            { color: '#f5c2e7', label: 'Y-intercept' },
            { color: '#a6e3a1', label: 'Local maximum' },
            { color: '#f38ba8', label: 'Local minimum' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 12, height: 12, borderRadius: 6,
                border: `2px solid ${item.color}`,
                background: item.color + '66',
                flexShrink: 0,
              }} />
              <span style={{ color: theme.subtext }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
