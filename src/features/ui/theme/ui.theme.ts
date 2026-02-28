// Feature: UI | Why: Centralize palette so accent + base colors stay consistent
import type { AppTheme } from '../../../../App';
import { BASE } from './ui.primitives';

// Re-export tokens + primitives for one-stop imports
export { uiRadius, uiSpace, uiFont, uiShadow, uiDuration, domainAccent } from './ui.tokens';
export { BASE, webGlass, webInteractive, webShadow } from './ui.primitives';

export type UiColors = Readonly<{
    bg: string;
    bgElevated: string;
    bgSurface: string;
    panel: string;
    panel2: string;
    panelHover: string;
    border: string;
    borderStrong: string;
    borderSubtle: string;
    text: string;
    textDim: string;
    textMuted: string;
    accent: string;
    accentSoft: string;
    accentGlow: string;
    accentMuted: string;
    success: string;
    successSoft: string;
    warning: string;
    warningSoft: string;
    danger: string;
    dangerSoft: string;
    info: string;
    infoSoft: string;
}>;

/** Derived from BASE — only adds panelHover which BASE lacks */
const base = Object.freeze({
    bg: BASE.bg,
    bgElevated: BASE.bgElevated,
    bgSurface: BASE.bgSurface,
    panel: BASE.panel,
    panel2: BASE.panel2,
    panelHover: 'rgba(18, 24, 36, 0.95)',
    border: BASE.borderMed,
    borderStrong: BASE.borderStrong,
    borderSubtle: BASE.borderSubtle,
    text: BASE.text,
    textDim: BASE.textDim,
    textMuted: BASE.textMuted,
    success: BASE.success,
    successSoft: BASE.successSoft,
    warning: BASE.warning,
    warningSoft: BASE.warningSoft,
    danger: BASE.danger,
    dangerSoft: BASE.dangerSoft,
    info: BASE.info,
    infoSoft: BASE.infoSoft,
});

const accents = Object.freeze({ red: '#ff5c8a', blue: '#5aa8ff' });

/** Singleton cache — only 2 possible themes, returns same frozen ref every call */
const _themeCache = new Map<AppTheme, UiColors>();

/** Returns the full color palette for the active theme — cached per theme key */
export const uiColors = (theme: AppTheme): UiColors => {
    const hit = _themeCache.get(theme);
    if (hit) return hit;
    const accent = theme === 'red' ? accents.red : accents.blue;
    const result: UiColors = Object.freeze({
        ...base,
        accent,
        accentSoft: `${accent}18`,
        accentGlow: `${accent}55`,
        accentMuted: `${accent}88`,
    });
    _themeCache.set(theme, result);
    return result;
};
