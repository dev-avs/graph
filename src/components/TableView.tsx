import React, { useState, useMemo } from 'react';
import { Equation } from '../types';
import { ThemeVars } from '../themes';

interface Props {
  equations: Equation[];
  theme: ThemeVars;
}

type Tag = 'zero' | 'max' | 'min' | null;

interface Row {
  x: number;
  ys: (number | null)[];
  tags: Tag[];
}

const TAG_COLOR: Record<NonNullable<Tag>, string> = {
  zero: '#a6e3a1',
  max:  '#89b4fa',
  min:  '#f38ba8',
};

const TAG_LABEL: Record<NonNullable<Tag>, string> = {
  zero: 'zero',
  max:  'max',
  min:  'min',
};

function safeEval(fn: (x: number) => number, x: number): number | null {
  try {
    const y = fn(x);
    return isFinite(y) ? y : null;
  } catch {
    return null;
  }
}

function fmtX(n: number, step: number): string {
  // Show enough decimals to represent the step cleanly
  const decimals = Math.max(0, Math.ceil(-Math.log10(Math.abs(step) + 1e-15)));
  const capped = Math.min(decimals, 6);
  return n.toFixed(capped);
}

function fmtY(n: number | null): string {
  if (n === null) return '—';
  if (Math.abs(n) < 1e-9) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e5 || (abs < 1e-3 && abs > 0)) return n.toExponential(3);
  if (abs >= 100) return n.toFixed(2);
  if (abs >= 10)  return n.toFixed(3);
  return n.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
}

export default function TableView({ equations, theme }: Props) {
  const [startX, setStartX] = useState(-5);
  const [step, setStep]     = useState(1);
  const [count]             = useState(21);
  const [keyOnly, setKeyOnly] = useState(false);

  const visEqs = equations.filter(eq => eq.visible && eq.fn);

  const rows: Row[] = useMemo(() => {
    if (visEqs.length === 0) return [];

    // Evaluate all rows first
    const raw: { x: number; ys: (number | null)[] }[] = [];
    for (let i = 0; i < count; i++) {
      const x = startX + i * step;
      raw.push({ x, ys: visEqs.map(eq => safeEval(eq.fn!, x)) });
    }

    // Tag each cell
    return raw.map((row, i) => {
      const tags: Tag[] = row.ys.map((y, ei) => {
        if (y === null) return null;

        // Zero: |y| < a fraction of the step's implied y-scale
        // Use neighbour sign-change as a more reliable detector
        const prev = i > 0 ? raw[i - 1].ys[ei] : null;
        const next = i < raw.length - 1 ? raw[i + 1].ys[ei] : null;

        if (Math.abs(y) < 1e-6) return 'zero';
        if (prev !== null && Math.sign(prev) !== Math.sign(y) && Math.sign(y) !== 0) return 'zero';

        // Local extremum by comparing with neighbours
        if (prev !== null && next !== null) {
          if (prev < y && next < y) return 'max';
          if (prev > y && next > y) return 'min';
        }

        return null;
      });
      return { ...row, tags };
    });
  }, [visEqs, startX, step, count]);

  const displayRows = keyOnly ? rows.filter(r => r.tags.some(t => t !== null)) : rows;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>

      {/* Controls */}
      <div style={{ padding: '10px 12px 8px', borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <NumInput label="Start x" value={startX} onChange={setStartX} theme={theme} step={step} />
          <NumInput label="Step"    value={step}   onChange={v => setStep(v === 0 ? 0.1 : v)} theme={theme} />
        </div>

        <button
          onClick={() => setKeyOnly(v => !v)}
          style={{
            width: '100%',
            padding: '6px 10px',
            borderRadius: 7,
            border: `1px solid ${keyOnly ? theme.accent : theme.border}`,
            background: keyOnly ? theme.accent + '18' : 'transparent',
            color: keyOnly ? theme.accent : theme.overlay,
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.15s',
          }}
        >
          <span style={{
            width: 14, height: 14, borderRadius: 3,
            background: keyOnly ? theme.accent + '30' : 'transparent',
            border: `1.5px solid ${keyOnly ? theme.accent : theme.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, fontSize: 10, color: keyOnly ? theme.accent : theme.overlay,
          }}>
            {keyOnly ? '✓' : ''}
          </span>
          Key rows only (zeros, maxima, minima)
        </button>
      </div>

      {/* Table */}
      {visEqs.length === 0 ? (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 8, color: theme.overlay, fontSize: 13, padding: 24, textAlign: 'center',
        }}>
          <span style={{ fontSize: 28, opacity: 0.3 }}>𝑥</span>
          No visible equations to tabulate.
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            <thead>
              <tr style={{ background: theme.surface, position: 'sticky', top: 0, zIndex: 1 }}>
                <th style={{
                  padding: '7px 10px 7px 14px',
                  textAlign: 'right',
                  color: theme.subtext,
                  fontWeight: 600,
                  fontSize: 11,
                  borderBottom: `2px solid ${theme.border}`,
                  letterSpacing: 0.3,
                }}>
                  x
                </th>
                {visEqs.map(eq => (
                  <th key={eq.id} style={{
                    padding: '7px 10px',
                    textAlign: 'right',
                    borderBottom: `2px solid ${theme.border}`,
                    borderLeft: `1px solid ${theme.border}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                      <span style={{
                        color: theme.text, fontWeight: 500, fontSize: 11,
                        maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {eq.expr || 'f(x)'}
                      </span>
                      <div style={{
                        width: 9, height: 9, borderRadius: '50%',
                        background: eq.color, flexShrink: 0,
                        boxShadow: `0 0 4px ${eq.color}88`,
                      }} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayRows.length === 0 ? (
                <tr>
                  <td colSpan={visEqs.length + 1} style={{
                    padding: '24px 16px', textAlign: 'center',
                    color: theme.overlay, fontSize: 12,
                  }}>
                    No key rows in this range.<br />Try a different start or step.
                  </td>
                </tr>
              ) : displayRows.map((row, i) => {
                const rowTag = row.tags.find(t => t !== null) ?? null;
                const hc = rowTag ? TAG_COLOR[rowTag] : null;

                return (
                  <tr
                    key={i}
                    style={{
                      background: hc
                        ? hc + '14'
                        : i % 2 === 0 ? 'transparent' : theme.surface + '50',
                      borderLeft: `3px solid ${hc ?? 'transparent'}`,
                      transition: 'background 0.1s',
                    }}
                  >
                    {/* x cell */}
                    <td style={{
                      padding: '5px 10px 5px 11px',
                      textAlign: 'right',
                      color: hc ?? theme.subtext,
                      fontWeight: hc ? 600 : 400,
                      fontSize: 11,
                      whiteSpace: 'nowrap',
                    }}>
                      {fmtX(row.x, step)}
                    </td>

                    {/* y cells */}
                    {row.ys.map((y, ei) => {
                      const tag = row.tags[ei];
                      const tc = tag ? TAG_COLOR[tag] : null;
                      return (
                        <td key={ei} style={{
                          padding: '5px 10px',
                          textAlign: 'right',
                          color: tc ?? (y === null ? theme.overlay : theme.text),
                          fontWeight: tc ? 600 : 400,
                          borderLeft: `1px solid ${theme.border}`,
                          whiteSpace: 'nowrap',
                        }}>
                          {fmtY(y)}
                          {tag && (
                            <span style={{
                              marginLeft: 4, fontSize: 9,
                              color: TAG_COLOR[tag],
                              opacity: 0.8,
                              fontWeight: 500,
                            }}>
                              {TAG_LABEL[tag]}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div style={{
        padding: '7px 12px',
        borderTop: `1px solid ${theme.border}`,
        display: 'flex',
        gap: 14,
        flexShrink: 0,
        background: theme.surface + '60',
      }}>
        {(Object.entries(TAG_COLOR) as [NonNullable<Tag>, string][]).map(([tag, color]) => (
          <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 7, height: 7, borderRadius: 2, background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: theme.overlay, letterSpacing: 0.2 }}>{TAG_LABEL[tag]}</span>
          </div>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: theme.overlay }}>
          {rows.length} rows · Δx = {step}
        </span>
      </div>
    </div>
  );
}

function NumInput({ label, value, onChange, theme, step: inputStep }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  theme: ThemeVars;
  step?: number;
}) {
  const [raw, setRaw] = useState(String(value));

  // Sync raw when value changes externally
  React.useEffect(() => { setRaw(String(value)); }, [value]);

  const commit = (s: string) => {
    const v = parseFloat(s);
    if (!isNaN(v) && isFinite(v)) onChange(v);
    else setRaw(String(value)); // revert
  };

  return (
    <div style={{ flex: 1 }}>
      <div style={{
        fontSize: 10, color: theme.overlay, marginBottom: 3,
        fontFamily: 'Inter, sans-serif', letterSpacing: 0.2,
      }}>
        {label}
      </div>
      <input
        type="number"
        value={raw}
        step={inputStep}
        onChange={e => setRaw(e.target.value)}
        onBlur={e => commit(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') commit((e.target as HTMLInputElement).value); }}
        style={{
          width: '100%',
          background: theme.surface2,
          border: `1px solid ${theme.border}`,
          borderRadius: 6,
          padding: '5px 8px',
          color: theme.text,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          outline: 'none',
        }}
      />
    </div>
  );
}
