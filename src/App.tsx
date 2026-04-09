import React, { useState, useCallback } from 'react';
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
  const [themeId, setThemeId] = useState<ThemeId>('mocha');
  const [view, setView] = useState<View>({ cx: 0, cy: 0, scale: 80 });
  const [showMarkers, setShowMarkers] = useState(true);
  const [lastAddedId, setLastAddedId] = useState<number | null>(null);
  const [equations, setEquations] = useState<Equation[]>(() => [
    withCompiled(makeEquation('sin(x)')),
    withCompiled(makeEquation('x^2 / 4')),
  ]);

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
      display: 'flex',
      height: '100vh',
      width: '100vw',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <Sidebar
        equations={equations}
        theme={theme}
        themeId={themeId}
        showMarkers={showMarkers}
        onThemeChange={setThemeId}
        onMarkersChange={setShowMarkers}
        onAddEquation={addEquation}
        onChangeExpr={changeExpr}
        onToggleVisible={toggleVisible}
        onDelete={deleteEquation}
        onColorChange={changeColor}
        lastAddedId={lastAddedId}
      />
      <GraphCanvas
        equations={equations}
        view={view}
        onViewChange={setView}
        theme={theme}
        showMarkers={showMarkers}
      />
    </div>
  );
}
