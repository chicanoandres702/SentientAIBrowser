// Feature: UI | Why: Design tokens — spacing, radius, shadows, timing

/** Border-radius tokens */
export const uiRadius = Object.freeze({
  xs: 6, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, pill: 999,
});

/** Spacing scale */
export const uiSpace = Object.freeze({
  xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32,
});

/** Typography presets */
export const uiFont = Object.freeze({
  h1: { fontSize: 20, fontWeight: '800' as const, letterSpacing: 0.3 },
  h2: { fontSize: 16, fontWeight: '700' as const, letterSpacing: 0.2 },
  h3: { fontSize: 13, fontWeight: '700' as const, letterSpacing: 0.15 },
  body: { fontSize: 13, fontWeight: '500' as const, letterSpacing: 0.1 },
  caption: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.2 },
  micro: { fontSize: 9, fontWeight: '700' as const, letterSpacing: 1.0 },
  tag: { fontSize: 8, fontWeight: '800' as const, letterSpacing: 1.5 },
  nano: { fontSize: 7, fontWeight: '700' as const },
  mono: { fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.4 },
});

/** Domain-specific accent overrides */
export const domainAccent = Object.freeze({
  scholar: '#D4AF37',
  survey: '#00d2ff',
  purple: '#bf5af2',
});

/** Shadow presets (web) */
export const uiShadow = Object.freeze({
  sm: '0 1px 3px rgba(0,0,0,0.3)',
  md: '0 4px 12px rgba(0,0,0,0.35)',
  lg: '0 8px 24px rgba(0,0,0,0.4)',
  xl: '0 12px 40px rgba(0,0,0,0.5)',
  glow: (c: string) => `0 0 20px ${c}44, 0 0 60px ${c}22`,
  inset: 'inset 0 1px 3px rgba(0,0,0,0.3)',
});

/** Animation duration tokens */
export const uiDuration = Object.freeze({
  fast: 120, normal: 200, slow: 350,
  spring: { tension: 80, friction: 10 },
});
