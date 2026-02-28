// Feature: Tasks | Why: Shared mobile task primitives — every mobile component imports from here
import { StyleSheet, Platform } from 'react-native';
import { BASE, webGlass } from '../../../features/ui/theme/ui.primitives';
import { MOBILE } from './mobile-task.constants';

// Re-export so existing imports `{ MOBILE, m }` keep working
export { MOBILE } from './mobile-task.constants';

export const m = StyleSheet.create({
    /* Containers */
    screen: { flex: 1, backgroundColor: BASE.bgDeep },
    safeTop: { paddingTop: Platform.OS === 'ios' ? 44 : 8 },
    row: { flexDirection: 'row', alignItems: 'center' },
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    col: { flexDirection: 'column' },
    center: { alignItems: 'center', justifyContent: 'center' },
    flex1: { flex: 1 },

    /* Glass panels */
    glass: { backgroundColor: BASE.panel, borderWidth: 1, borderColor: BASE.borderSubtle, borderRadius: MOBILE.radius, overflow: 'hidden', ...webGlass(12) },
    glassSm: { backgroundColor: BASE.panelGlass, borderWidth: 1, borderColor: BASE.borderSubtle, borderRadius: MOBILE.radiusSm, overflow: 'hidden', ...webGlass(8) },

    /* Text */
    h1: { fontSize: 14, fontWeight: '900', color: BASE.text, letterSpacing: 0.8 },
    h2: { fontSize: 12, fontWeight: '800', color: BASE.text, letterSpacing: 0.5 },
    h3: { fontSize: 10, fontWeight: '700', color: BASE.textDim, letterSpacing: 0.4 },
    caption: { fontSize: 8, fontWeight: '700', color: BASE.textMuted, letterSpacing: 1.0, textTransform: 'uppercase' as any },
    label: { fontSize: 9, fontWeight: '600', color: BASE.textMuted, letterSpacing: 0.3 },
    body: { fontSize: 11, color: BASE.textDim, lineHeight: 16 },
    mono: { fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: BASE.textMuted },

    /* Chip / pill */
    chip: { height: MOBILE.chipH, paddingHorizontal: 10, borderRadius: MOBILE.radiusPill, borderWidth: 1, borderColor: BASE.borderFocusStrong, alignItems: 'center', justifyContent: 'center' },
    chipText: { fontSize: 9, fontWeight: '700', color: BASE.textMuted, letterSpacing: 0.3 },

    /* Buttons */
    btnPrimary: { height: 40, borderRadius: MOBILE.radiusSm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
    btnGhost: { height: 36, borderRadius: MOBILE.radiusSm, borderWidth: 1, borderColor: BASE.borderFocusStrong, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
    btnIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

    /* Dividers */
    divider: { height: 1, backgroundColor: BASE.borderSubtle, marginVertical: 8 },
    dividerAccent: { height: 2, borderRadius: 1, marginVertical: 6 },

    /* Shadows (platform-adaptive) */
    shadow: Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
        android: { elevation: 6 },
        web: { boxShadow: '0 4px 24px rgba(0,0,0,0.4)' } as any,
        default: {},
    }),
    shadowSm: Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6 },
        android: { elevation: 3 },
        web: { boxShadow: '0 2px 12px rgba(0,0,0,0.3)' } as any,
        default: {},
    }),
});
