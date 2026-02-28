// Feature: UI | Why: Shared style primitives eliminate duplication across 12+ style files
import { Platform } from 'react-native';

// ─── Static Base Palette (dark-only, accent-independent) ───
export const BASE = Object.freeze({
  bg: '#060810',
  bgElevated: '#0c1019',
  bgSurface: '#101520',
  bgDeep: '#040508',
  panel: 'rgba(10, 14, 22, 0.95)',
  panel2: 'rgba(8, 11, 17, 0.98)',
  panelDim: 'rgba(8, 11, 17, 0.96)',
  panelGlass: 'rgba(6, 8, 16, 0.98)',
  panelGlassLight: 'rgba(6, 8, 16, 0.85)',
  text: '#eaf0ff',
  textDim: '#b8c8e4',
  textMuted: '#6b7a96',
  textFaint: '#4d5b75',
  borderSubtle: 'rgba(140, 160, 200, 0.06)',
  border: 'rgba(140, 160, 200, 0.08)',
  borderMed: 'rgba(140, 160, 200, 0.10)',
  borderStrong: 'rgba(140, 160, 200, 0.12)',
  borderFocus: 'rgba(185, 205, 230, 0.12)',
  borderFocusStrong: 'rgba(185, 205, 230, 0.16)',
  inputBg: 'rgba(138, 156, 188, 0.08)',
  overlayBg: 'rgba(3, 5, 10, 0.85)',
  controlBg: 'rgba(140, 160, 200, 0.06)',
  handleBg: 'rgba(140, 160, 200, 0.20)',
  shadowBlack: 'rgba(0, 0, 0, 0.3)',
  disabled: '#555555',
  inactive: '#2a2a2a',
  onAccent: '#000000',
  success: '#34d399',
  successSoft: 'rgba(52, 211, 153, 0.12)',
  danger: '#f87171',
  dangerSoft: 'rgba(248, 113, 113, 0.12)',
  warning: '#fbbf24',
  warningSoft: 'rgba(251, 191, 36, 0.12)',
  info: '#60a5fa',
  infoSoft: 'rgba(96, 165, 250, 0.12)',
});

// ─── Web-only Mixins ───
export const webGlass = (blur = 16) =>
  Platform.select({
    web: { backdropFilter: `blur(${blur}px)` } as any,
    default: {},
  });

export const webInteractive = Platform.select({
  web: { cursor: 'pointer', transition: 'all 150ms ease' } as any,
  default: {},
});

export const webShadow = (shadow: string) =>
  Platform.select({
    web: { boxShadow: shadow } as any,
    default: {},
  });
