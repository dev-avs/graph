import React, { useState } from 'react';
import { Equation, ThemeId } from '../types';
import { ThemeVars } from '../themes';
import EquationItem from './EquationItem';
import Settings from './Settings';

interface Props {
  equations: Equation[];
  theme: ThemeVars;
  themeId: ThemeId;
  showMarkers: boolean;
  onThemeChange: (id: ThemeId) => void;
  onMarkersChange: (v: boolean) => void;
  onAddEquation: () => void;
  onChangeExpr: (id: number, expr: string) => void;
  onToggleVisible: (id: number) => void;
  onDelete: (id: number) => void;
  onColorChange: (id: number, color: string) => void;
  lastAddedId: number | null;
}

type Tab = 'equations' | 'settings';

export default function Sidebar({
  equations, theme, themeId, showMarkers,
  onThemeChange, onMarkersChange,
  onAddEquation, onChangeExpr, onToggleVisible, onDelete, onColorChange,
  lastAddedId,
}: Props) {
  const [tab, setTab] = useState<Tab>('equations');

  return (
    <div style={{
      width: 300, flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      background: theme.bg,
      borderRight: `1px solid ${theme.border}`,
      height: '100%',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${theme.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26, color: theme.subtext, lineHeight: 1 }}>∫</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: theme.text, letterSpacing: -0.5 }}>Grapher</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
        {(['equations', 'settings'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: '10px 0',
              background: tab === t ? theme.surface : 'transparent',
              border: 'none',
              borderBottom: `2px solid ${tab === t ? theme.subtext : 'transparent'}`,
              color: tab === t ? theme.text : theme.overlay,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: tab === t ? 600 : 400,
              transition: 'all 0.15s',
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'equations' ? (
        <>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {equations.length === 0 ? (
              <div style={{ padding: 24, color: theme.overlay, fontSize: 13, textAlign: 'center' }}>
                No equations yet. Add one below.
              </div>
            ) : (
              equations.map(eq => (
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
              ))
            )}
          </div>
          <div style={{ padding: 12, borderTop: `1px solid ${theme.border}` }}>
            <button
              onClick={onAddEquation}
              style={{
                width: '100%',
                padding: '9px 0',
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                color: theme.text,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = theme.surface2)}
              onMouseLeave={e => (e.currentTarget.style.background = theme.surface)}
            >
              + Add Equation
            </button>
          </div>
        </>
      ) : (
        <Settings
          theme={theme}
          themeId={themeId}
          showMarkers={showMarkers}
          onThemeChange={onThemeChange}
          onMarkersChange={onMarkersChange}
        />
      )}
    </div>
  );
}
