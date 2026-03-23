// Feature: UI | Source: WorkflowsOverview.styles.ts
// Task: Migrate workflows overview styles to feature module
import { StyleSheet, Platform } from 'react-native';
import { BASE, webInteractive, webShadow } from '@features/ui/theme/ui.primitives';

export const overviewStyles = StyleSheet.create({
    container: {
        borderBottomWidth: 1,
        borderBottomColor: BASE.borderSubtle,
        backgroundColor: 'rgba(5, 7, 13, 0.97)',
        ...Platform.select({ web: { backdropFilter: 'blur(18px)' } as any, default: {} }),
    },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6,
    },
    headerTitle: { fontSize: 9, fontWeight: '900', letterSpacing: 2, color: BASE.textFaint },
    headerCount: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
    grid: { paddingHorizontal: 12, paddingBottom: 14, paddingTop: 2, gap: 8, alignItems: 'flex-start' },
    card: {
        width: 150, minHeight: 90,
        backgroundColor: 'rgba(140, 160, 200, 0.04)',
        borderRadius: 16, borderWidth: 1, borderColor: BASE.borderSubtle,
        padding: 12, gap: 5, overflow: 'hidden',
        ...webInteractive,
        ...Platform.select({ web: { transition: 'all 200ms ease' } as any, default: {} }),
    },
    activeCard: {
        backgroundColor: 'rgba(140, 160, 200, 0.10)',
        borderColor: 'rgba(185, 205, 230, 0.20)',
        ...webShadow('0 0 24px rgba(0,210,255,0.08), inset 0 1px 0 rgba(255,255,255,0.04)'),
        ...Platform.select({ default: { elevation: 5 } }),
    },
    activePill: {
        position: 'absolute', top: 0, left: 20, right: 20,
        height: 2, borderBottomLeftRadius: 2, borderBottomRightRadius: 2,
    },
    favicon: {
        width: 36, height: 36, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center',
    },
    faviconText: { fontSize: 18, fontWeight: '700' },
    cardTitle: { fontSize: 11, fontWeight: '600', color: BASE.textDim, letterSpacing: 0.1 },
    cardUrl: { fontSize: 9, color: BASE.textFaint, letterSpacing: 0.2 },
    tabCount: { fontSize: 8, fontWeight: '700', letterSpacing: 0.8, color: BASE.textFaint, marginTop: 2 },
    closeBtn: {
        position: 'absolute', top: 8, right: 8,
        width: 20, height: 20, borderRadius: 10,
        backgroundColor: 'rgba(140, 160, 200, 0.07)',
        justifyContent: 'center', alignItems: 'center',
        ...webInteractive,
    },
    closeIcon: { fontSize: 9, color: BASE.textMuted },
    newCard: {
        width: 110, minHeight: 90,
        backgroundColor: 'transparent',
        borderRadius: 16, borderWidth: 1,
        borderStyle: 'dashed', borderColor: BASE.borderMed,
        justifyContent: 'center', alignItems: 'center', gap: 4,
        ...webInteractive,
    },
    newIcon: { fontSize: 24, fontWeight: '200' },
    newLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 1.5 },
});
