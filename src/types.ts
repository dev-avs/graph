export interface Equation {
  id: number;
  expr: string;
  color: string;
  fn: ((x: number) => number) | null;
  error: string | null;
  visible: boolean;
}

export interface View {
  cx: number;
  cy: number;
  scale: number; // pixels per unit
}

export type ThemeId = 'obsidian' | 'vercel_light' | 'vercel_dark' | 'mocha' | 'latte' | 'nord' | 'dracula' | 'sakura' | 'sakuradark';

export interface KeyPoint {
  x: number;
  y: number;
  kind: 'zero' | 'yint' | 'max' | 'min' | 'intersect';
  label: string;
  color: string;
}
