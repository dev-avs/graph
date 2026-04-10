import React, { useState, useCallback, useEffect } from 'react';
import { Equation, View, ThemeId } from './types';
import { THEMES } from './themes';
import { compile } from './utils/compile';
import GraphCanvas from './components/GraphCanvas';
import Sidebar from './components/Sidebar';

const COLORS = [
  '#f38ba8', '#89b4fa', '#a6e3a1', '#cba6f7',
  '#fab387', '#f9e2af', '#89dceb', '#94e2d5',
];

let _nextId = 1;
let _colorIdx = 0;

function makeEquation(expr = ''): Equation {
  const id = _nextId++;
  const color = COLORS[_colorIdx++ % COLORS.length];
  return { id, expr, color, fn: null, error: null, visible: true };
}

function withCompiled(eq: Equation): Equation {
  if (!eq.expr.trim()) return { ...eq, fn: null, error: null };
  try {
    return { ...eq, fn: compile(eq.expr), error: null };
  } catch (err) {
    return { ...eq, fn: null, error: err instanceof Error ? err.message : String(err) };
  }
}

export default function App() {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    const saved = localStorage.getItem('grapher_theme');
    return THEMES[saved as ThemeId] ? (saved as ThemeId) : 'obsidian';
  });

  useEffect(() => {
    localStorage.setItem('grapher_theme', themeId);
  }, [themeId]);
  const [view, setView] = useState<View>({ cx: 0, cy: 0, scale: 80 });
  const [showMarkers, setShowMarkers] = useState(true);
  const [showGrid, setShowGrid] = useState(() => localStorage.getItem('grapher_grid') !== 'false');
  const [thickLines, setThickLines] = useState(() => localStorage.getItem('grapher_thick_lines') === 'true');
  const [lastAddedId, setLastAddedId] = useState<number | null>(null);

  useEffect(() => { localStorage.setItem('grapher_grid', String(showGrid)); }, [showGrid]);
  useEffect(() => { localStorage.setItem('grapher_thick_lines', String(thickLines)); }, [thickLines]);
  const [equations, setEquations] = useState<Equation[]>(() => {
    try {
      const saved = localStorage.getItem('grapher_equations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const maxId = Math.max(...parsed.map(e => e.id));
          if (maxId >= _nextId) _nextId = maxId + 1;
          return parsed.map((eq: Equation) => withCompiled({ ...eq, fn: null, error: null }));
        }
      }
    } catch(e) {}
    return [
      withCompiled(makeEquation('sin(x)')),
      withCompiled(makeEquation('x² / 4')),
    ];
  });

  useEffect(() => {
    localStorage.setItem('grapher_equations', JSON.stringify(equations.map(eq => ({ ...eq, fn: null }))));
  }, [equations]);

  const theme = THEMES[themeId];

  const addEquation = useCallback(() => {
    const eq = makeEquation('');
    setLastAddedId(eq.id);
    setEquations(prev => [...prev, eq]);
  }, []);

  const changeExpr = useCallback((id: number, expr: string) => {
    setEquations(prev =>
      prev.map(eq => eq.id === id ? withCompiled({ ...eq, expr }) : eq)
    );
  }, []);

  const toggleVisible = useCallback((id: number) => {
    setEquations(prev =>
      prev.map(eq => eq.id === id ? { ...eq, visible: !eq.visible } : eq)
    );
  }, []);

  const deleteEquation = useCallback((id: number) => {
    setEquations(prev => prev.filter(eq => eq.id !== id));
  }, []);

  const changeColor = useCallback((id: number, color: string) => {
    setEquations(prev =>
      prev.map(eq => eq.id === id ? { ...eq, color } : eq)
    );
  }, []);

  return (
    <div style={{
      position: 'relative',
      height: '100vh',
      width: '100vw',
      fontFamily: '"SF Pro Text", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      overflow: 'hidden',
      background: theme.bg,
    }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <GraphCanvas
          equations={equations}
          view={view}
          onViewChange={setView}
          theme={theme}
          showMarkers={showMarkers}
          showGrid={showGrid}
          thickLines={thickLines}
        />
      </div>
      
      <Sidebar
        equations={equations}
        theme={theme}
        themeId={themeId}
        showMarkers={showMarkers}
        showGrid={showGrid}
        thickLines={thickLines}
        onThemeChange={setThemeId}
        onMarkersChange={setShowMarkers}
        onGridChange={setShowGrid}
        onThickLinesChange={setThickLines}
        onAddEquation={addEquation}
        onChangeExpr={changeExpr}
        onToggleVisible={toggleVisible}
        onDelete={deleteEquation}
        onColorChange={changeColor}
        lastAddedId={lastAddedId}
      />
    </div>
  );
}
