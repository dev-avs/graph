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
  onThemeChange: (id: ThemeId) => void;
  onMarkersChange: (v: boolean) => void;
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

export default function Sidebar({
  equations, theme, themeId, showMarkers,
  onThemeChange, onMarkersChange,
  onAddEquation, onChangeExpr, onToggleVisible, onDelete, onColorChange,
  lastAddedId,
}: Props) {
  const [tab, setTab] = useState<Tab>('equations');

  return (
    <div style={{
      width: 296, flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      background: theme.bg,
      borderRight: `1px solid ${theme.border}`,
      height: '100%',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderBottom: `1px solid ${theme.border}`,
      }}>
        <GraphLogo accent={theme.accent} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, letterSpacing: -0.4, lineHeight: 1.2 }}>
            Grapher
          </div>
          <div style={{ fontSize: 10, color: theme.overlay, letterSpacing: 0.3, marginTop: 1 }}>
            FUNCTION VISUALIZER
          </div>
        </div>
      </div>

      {/* Pill tabs */}
      <div style={{ padding: '10px 12px 0' }}>
        <div style={{
          display: 'flex',
          background: theme.surface,
          borderRadius: 9,
          padding: 3,
          gap: 2,
          border: `1px solid ${theme.border}`,
        }}>
          {([
            { id: 'equations' as Tab, Icon: FnIcon,    label: 'Functions' },
            { id: 'table'     as Tab, Icon: TableIcon, label: 'Table' },
            { id: 'settings'  as Tab, Icon: GearIcon,  label: 'Settings' },
          ]).map(({ id, Icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                flex: 1,
                padding: '6px 0',
                borderRadius: 6,
                background: tab === id ? theme.surface2 : 'transparent',
                border: 'none',
                color: tab === id ? theme.text : theme.overlay,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: tab === id ? 600 : 400,
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                boxShadow: tab === id
                  ? theme.isDark
                    ? '0 1px 4px rgba(0,0,0,0.35)'
                    : '0 1px 4px rgba(0,0,0,0.1)'
                  : 'none',
              }}
            >
              <Icon />
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'equations' ? (
        <>
          <div style={{ flex: 1, overflowY: 'auto', paddingTop: 6 }}>
            {equations.length === 0 ? (
              <div style={{
                padding: '32px 20px',
                color: theme.overlay,
                fontSize: 13,
                textAlign: 'center',
                lineHeight: 1.6,
              }}>
                <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.4 }}>f(x)</div>
                No equations yet.<br />Add one below.
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

          {/* Add equation button */}
          <div style={{ padding: '10px 12px 14px' }}>
            <AddButton theme={theme} onClick={onAddEquation} />
          </div>
        </>
      ) : tab === 'table' ? (
        <TableView equations={equations} theme={theme} />
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

function AddButton({ theme, onClick }: { theme: ThemeVars; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%',
        padding: '9px 0',
        background: hov ? theme.surface : 'transparent',
        border: `1.5px dashed ${hov ? theme.subtext : theme.border}`,
        borderRadius: 9,
        color: hov ? theme.text : theme.overlay,
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        transition: 'all 0.15s',
        letterSpacing: 0.2,
      }}
    >
      <span style={{
        width: 18, height: 18, borderRadius: '50%',
        background: hov ? theme.accent + '30' : 'transparent',
        border: `1.5px solid ${hov ? theme.accent : theme.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: hov ? theme.accent : theme.overlay,
        transition: 'all 0.15s',
        flexShrink: 0,
        fontSize: 14,
        lineHeight: 1,
      }}>
        +
      </span>
      Add equation
    </button>
  );
}
