import React, { useRef, useEffect } from 'react';
import { Equation } from '../types';
import { ThemeVars } from '../themes';

interface Props {
  eq: Equation;
  theme: ThemeVars;
  onChange: (id: number, expr: string) => void;
  onToggleVisible: (id: number) => void;
  onDelete: (id: number) => void;
  onColorChange: (id: number, color: string) => void;
  autoFocus?: boolean;
  onEnter?: () => void;
}

const EyeOpen = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOff = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function EquationItem({ eq, theme, onChange, onToggleVisible, onDelete, onColorChange, autoFocus, onEnter }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 12px',
      borderBottom: `1px solid ${theme.border}`,
    }}>
      {/* Color swatch */}
      <div style={{ position: 'relative', flexShrink: 0, width: 22, height: 22 }}>
        <input
          type="color"
          value={eq.color}
          onChange={e => onColorChange(eq.id, e.target.value)}
          style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer', width: '100%', height: '100%' }}
          title="Change color"
        />
        <div style={{
          width: 22, height: 22, borderRadius: 5,
          background: eq.color,
          border: `2px solid ${theme.border}`,
          pointerEvents: 'none',
        }} />
      </div>

      {/* Expression input */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <input
          ref={inputRef}
          value={eq.expr}
          onChange={e => onChange(eq.id, e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onEnter?.(); }}
          placeholder="e.g. sin(x), x^2"
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: eq.error ? '#f38ba8' : theme.text,
            fontFamily: 'monospace',
            fontSize: 14,
          }}
        />
        {eq.error && (
          <div style={{ color: '#f38ba8', fontSize: 11, marginTop: 1 }}>{eq.error}</div>
        )}
      </div>

      {/* Visibility toggle */}
      <button
        onClick={() => onToggleVisible(eq.id)}
        title={eq.visible ? 'Hide' : 'Show'}
        style={{
          width: 34, height: 34, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 7,
          border: `2px solid ${eq.visible ? eq.color : theme.border}`,
          background: eq.visible ? eq.color + '22' : theme.surface2,
          color: eq.visible ? eq.color : theme.overlay,
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        {eq.visible ? <EyeOpen /> : <EyeOff />}
      </button>

      {/* Delete button */}
      <button
        onClick={() => onDelete(eq.id)}
        title="Delete equation"
        style={{
          width: 34, height: 34, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 7,
          border: '2px solid #f38ba8',
          background: 'transparent',
          color: '#f38ba8',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = '#f38ba8';
          e.currentTarget.style.color = '#1e1e2e';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#f38ba8';
        }}
      >
        <XIcon />
      </button>
    </div>
  );
}
