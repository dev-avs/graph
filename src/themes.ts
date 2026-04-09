import { ThemeId } from './types';

export interface ThemeVars {
  name: string;
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  subtext: string;
  overlay: string;
  grid: string;
  axis: string;
  canvasBg: string;
  label: string;
  accent: string;
  isDark: boolean;
}

export const THEMES: Record<ThemeId, ThemeVars> = {
  mocha: {
    name: 'Catppuccin Mocha',
    bg: '#1e1e2e',
    surface: '#313244',
    surface2: '#45475a',
    border: '#585b70',
    text: '#cdd6f4',
    subtext: '#a6adc8',
    overlay: '#6c7086',
    grid: 'rgba(108,112,134,0.3)',
    axis: 'rgba(166,173,200,0.8)',
    canvasBg: '#181825',
    label: '#cdd6f4',
    accent: '#89b4fa',
    isDark: true,
  },
  latte: {
    name: 'Catppuccin Latte',
    bg: '#eff1f5',
    surface: '#e6e9ef',
    surface2: '#dce0e8',
    border: '#ccd0da',
    text: '#4c4f69',
    subtext: '#6c6f85',
    overlay: '#8c8fa1',
    grid: 'rgba(140,143,161,0.25)',
    axis: 'rgba(76,79,105,0.8)',
    canvasBg: '#dce0e8',
    label: '#4c4f69',
    accent: '#1e66f5',
    isDark: false,
  },
  nord: {
    name: 'Nord',
    bg: '#2e3440',
    surface: '#3b4252',
    surface2: '#434c5e',
    border: '#4c566a',
    text: '#eceff4',
    subtext: '#d8dee9',
    overlay: '#4c566a',
    grid: 'rgba(76,86,106,0.4)',
    axis: 'rgba(216,222,233,0.7)',
    canvasBg: '#242933',
    label: '#eceff4',
    accent: '#88c0d0',
    isDark: true,
  },
  dracula: {
    name: 'Dracula',
    bg: '#282a36',
    surface: '#44475a',
    surface2: '#383a47',
    border: '#6272a4',
    text: '#f8f8f2',
    subtext: '#bd93f9',
    overlay: '#6272a4',
    grid: 'rgba(98,114,164,0.3)',
    axis: 'rgba(248,248,242,0.7)',
    canvasBg: '#21222c',
    label: '#f8f8f2',
    accent: '#bd93f9',
    isDark: true,
  },
};
