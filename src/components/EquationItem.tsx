import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
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

const PALETTE = [
  '#f38ba8', '#eba0ac', '#fab387', '#f9e2af',
  '#a6e3a1', '#94e2d5', '#89dceb', '#89b4fa',
  '#b4befe', '#cba6f7', '#f5c2e7', '#74c7ec',
  '#a6da95', '#ee99a0', '#ed8796', '#c6a0f6',
];

const EyeOpen = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOff = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

interface PickerPopoverProps {
  color: string;
  pos: { top: number; left: number };
  theme: ThemeVars;
  onChange: (c: string) => void;
  onClose: () => void;
}

function PickerPopover({ color, pos, theme, onChange, onClose }: PickerPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hex, setHex] = useState(color);

  useEffect(() => { setHex(color); }, [color]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    // tiny delay so the opening click doesn't immediately close it
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 80);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [onClose]);

  const handleHex = (v: string) => {
    setHex(v);
    if (/^#[0-9a-f]{6}$/i.test(v)) onChange(v);
  };

  // Clamp to viewport
  const left = Math.min(pos.left, window.innerWidth - 196);
  const top = pos.top + 4;

  return ReactDOM.createPortal(
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top,
        left,
        width: 188,
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: 10,
        padding: 10,
        boxShadow: theme.isDark
          ? '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)'
          : '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
        zIndex: 9999,
      }}
    >
      {/* Swatch grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5, marginBottom: 8 }}>
        {PALETTE.map(c => (
          <button
            key={c}
            onClick={() => { onChange(c); setHex(c); }}
            style={{
              width: '100%',
              aspectRatio: '1',
              borderRadius: 5,
              background: c,
              border: c.toLowerCase() === color.toLowerCase()
                ? '2px solid white'
                : '2px solid transparent',
              cursor: 'pointer',
              padding: 0,
              outline: 'none',
              boxShadow: c.toLowerCase() === color.toLowerCase()
                ? `0 0 0 2px ${c}`
                : undefined,
              transition: 'transform 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          />
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: theme.border, margin: '8px 0' }} />

      {/* Hex input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 20, height: 20, borderRadius: 4, flexShrink: 0,
          background: /^#[0-9a-f]{6}$/i.test(hex) ? hex : theme.overlay,
          border: `1px solid ${theme.border}`,
        }} />
        <input
          value={hex}
          onChange={e => handleHex(e.target.value)}
          onClick={e => e.stopPropagation()}
          style={{
            flex: 1,
            background: theme.surface2,
            border: `1px solid ${theme.border}`,
            borderRadius: 5,
            padding: '4px 7px',
            color: theme.text,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            outline: 'none',
          }}
          placeholder="#rrggbb"
          maxLength={7}
          spellCheck={false}
        />
      </div>
    </div>,
    document.body
  );
}

const SUPER_MAP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '(': '⁽', ')': '⁾', '.': '⋅',
  'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ', 'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ', 'i': 'ⁱ',
  'j': 'ʲ', 'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'n': 'ⁿ', 'o': 'ᵒ', 'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ',
  'u': 'ᵘ', 'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ', '=': '⁼'
};

function formatExpr(val: string): string {
  let out = val;
  // Parenthesized exponents: ^( ... ) -> strips parens, converts inner
  out = out.replace(/\^\(([^)]*)\)/g, (_, inner) => {
    return [...inner].map(c => SUPER_MAP[c.toLowerCase()] ? (c === c.toLowerCase() ? SUPER_MAP[c] : SUPER_MAP[c.toLowerCase()]) : c).join('');
  });
  // Auto-promote digits directly following a superscript digit
  out = out.replace(/([⁰¹²³⁴⁵⁶⁷⁸⁹]+)([0-9]+)/g, (_, supers, normals) => {
    return supers + [...normals].map(d => SUPER_MAP[d]).join('');
  });
  // Single digit/letter: ^2, ^x
  out = out.replace(/\^([0-9xny])/ig, (_, match) => {
    const l = match.toLowerCase();
    return SUPER_MAP[l] || match;
  });

  return out;
}

const EquationItem = React.memo(({ eq, theme, onChange, onToggleVisible, onDelete, onColorChange, autoFocus, onEnter }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const swatchRef = useRef<HTMLButtonElement>(null);
  const [pickerPos, setPickerPos] = useState<{ top: number; left: number } | null>(null);
  const [hovered, setHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(() => !eq.expr || !!autoFocus);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const openPicker = () => {
    if (swatchRef.current) {
      const r = swatchRef.current.getBoundingClientRect();
      setPickerPos({ top: r.bottom, left: r.left });
    }
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        borderBottom: `1px solid ${theme.border}`,
        background: hovered ? theme.surface + '80' : 'transparent',
        transition: 'background 0.12s',
        position: 'relative',
      }}
    >
      {/* Left color stripe */}
      <div style={{
        width: 3,
        alignSelf: 'stretch',
        background: eq.visible ? eq.color : theme.overlay,
        opacity: eq.visible ? 1 : 0.4,
        flexShrink: 0,
        transition: 'background 0.2s, opacity 0.2s',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, padding: '9px 10px 9px 10px' }}>
        {/* Color swatch button */}
        <button
          ref={swatchRef}
          onClick={openPicker}
          title="Change color"
          style={{
            width: 20, height: 20, borderRadius: '50%',
            background: eq.color,
            border: `2px solid ${theme.border}`,
            cursor: 'pointer',
            flexShrink: 0,
            padding: 0,
            transition: 'transform 0.15s, box-shadow 0.15s',
            boxShadow: hovered ? `0 0 0 3px ${eq.color}33` : 'none',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.2)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        />

        {/* Expression input */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: 6 }}>
          {!isEditing && eq.expr.includes('/') ? (
           <div 
             style={{ 
               padding: '4px 0', 
               cursor: 'text', 
               color: eq.error ? '#f38ba8' : eq.visible ? theme.text : theme.overlay, 
               fontSize: 14, 
               fontFamily: "'JetBrains Mono', monospace" 
             }}
             onClick={() => setIsEditing(true)}
           >
             <MathDisplay expr={eq.expr} color={eq.color} />
           </div>
          ) : (
            <input
              ref={inputRef}
              value={eq.expr}
              onBlur={() => setIsEditing(false)}
              onChange={e => onChange(eq.id, formatExpr(e.target.value))}
              onKeyDown={e => { if (e.key === 'Enter') onEnter?.(); }}
              placeholder="e.g. sin(x), x²"
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: eq.error ? '#f38ba8' : eq.visible ? theme.text : theme.overlay,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                caretColor: eq.color,
                height: 28,
              }}
            />
          )}
          {eq.error && (
            <div style={{
              color: '#f38ba8',
              fontSize: 10,
              marginTop: 2,
              fontFamily: "'JetBrains Mono', monospace",
              opacity: 0.85,
            }}>
              {eq.error}
            </div>
          )}
        </div>

        {/* Visibility toggle */}
        <button
          onClick={() => onToggleVisible(eq.id)}
          title={eq.visible ? 'Hide' : 'Show'}
          style={{
            width: 28, height: 28, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 7,
            border: `1px solid ${eq.visible ? eq.color + '60' : theme.border}`,
            background: eq.visible ? eq.color + '18' : 'transparent',
            color: eq.visible ? eq.color : theme.overlay,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = eq.visible ? eq.color + '30' : theme.surface2;
            e.currentTarget.style.color = eq.visible ? eq.color : theme.subtext;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = eq.visible ? eq.color + '18' : 'transparent';
            e.currentTarget.style.color = eq.visible ? eq.color : theme.overlay;
          }}
        >
          {eq.visible ? <EyeOpen /> : <EyeOff />}
        </button>

        {/* Delete button */}
        <button
          onClick={() => onDelete(eq.id)}
          title="Delete"
          style={{
            width: 28, height: 28, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 7,
            border: `1px solid transparent`,
            background: 'transparent',
            color: theme.overlay,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#f38ba820';
            e.currentTarget.style.color = '#f38ba8';
            e.currentTarget.style.borderColor = '#f38ba840';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = theme.overlay;
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <TrashIcon />
        </button>
      </div>

      {/* Color picker popover */}
      {pickerPos && (
        <PickerPopover
          color={eq.color}
          pos={pickerPos}
          theme={theme}
          onChange={c => onColorChange(eq.id, c)}
          onClose={() => setPickerPos(null)}
        />
      )}
    </div>
  );
});

export default EquationItem;

function MathDisplay({ expr, color }: { expr: string; color: string }) {
  if (!expr) return null;
  expr = expr.trim();
  
  let depth = 0;
  for (let i = 0; i < expr.length; i++) {
    const c = expr[i];
    if (c === '(' || c === '⁽') depth++;
    else if (c === ')' || c === '⁾') depth--;
    else if (depth === 0) {
      if ((c === '+' || c === '-') && i > 0) {
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <MathDisplay expr={expr.slice(0, i)} color={color} />
            <span>{c}</span>
            <MathDisplay expr={expr.slice(i + 1)} color={color} />
          </span>
        );
      }
    }
  }

  depth = 0;
  for (let i = 0; i < expr.length; i++) {
    const c = expr[i];
    if (c === '(' || c === '⁽') depth++;
    else if (c === ')' || c === '⁾') depth--;
    else if (depth === 0 && c === '/') {
      const num = expr.slice(0, i).trim();
      const den = expr.slice(i + 1).trim();
      const stripParens = (s: string) => {
        let str = s;
        while (str.startsWith('(') && str.endsWith(')')) {
          let d = 0, ok = true;
          for(let j=0; j<str.length-1; j++){
            if(str[j]==='(') d++;
            if(str[j]===')') d--;
            if(d===0) { ok=false; break; }
          }
          if(ok) str = str.slice(1, -1).trim();
          else break;
        }
        return str;
      };
      // For single visual element denominator, usually you want no parens on the top either.
      return (
        <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle', margin: '0 4px', lineHeight: 1.1 }}>
          <span style={{ borderBottom: `1.5px solid ${color}`, padding: '0 4px' }}>
            <MathDisplay expr={stripParens(num)} color={color} />
          </span>
          <span style={{ padding: '0 4px', marginTop: '1px' }}>
            <MathDisplay expr={stripParens(den)} color={color} />
          </span>
        </span>
      );
    }
  }

  return <span>{expr}</span>;
}
