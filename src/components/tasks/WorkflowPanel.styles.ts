// Feature: Tasks UI | Why: Single-workflow panel — compact rows, glassy card, timeline actions
import { StyleSheet, Platform } from 'react-native';
import { BASE, webInteractive, webShadow } from '../../features/ui/theme/ui.primitives';

export const wp = StyleSheet.create({
    scrollContent: { padding: 12, paddingBottom: 28 },
    // Header
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1.2 },
    headerSub: { fontSize: 8, color: BASE.textMuted, marginTop: 1, letterSpacing: 0.8 },
    purgeBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: BASE.borderSubtle },
    purgeText: { fontSize: 8, color: BASE.textMuted, fontWeight: '800', letterSpacing: 0.8 },
    // Task input
    inputRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    input: {
        flex: 1, height: 44, paddingHorizontal: 14, color: BASE.text, fontSize: 13, fontWeight: '600',
        backgroundColor: BASE.inputBg, borderRadius: 22, borderWidth: 1, borderColor: BASE.borderFocusStrong,
        ...Platform.select({ web: { outlineStyle: 'none' } as any, default: {} }),
    },
    addBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    addBtnText: { fontSize: 22, color: BASE.bg, fontWeight: '300', marginTop: -2 },
    // Active workflow card
    wfCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12 },
    wfLabel: { fontSize: 7, fontWeight: '900', letterSpacing: 1.8, marginBottom: 6 },
    wfTitle: { fontSize: 14, fontWeight: '800', color: BASE.text, letterSpacing: 0.1 },
    wfProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
    wfTrack: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
    wfBar: { height: 4, borderRadius: 2 },
    wfPct: { fontSize: 11, fontWeight: '800', minWidth: 30, textAlign: 'right' },
    wfStats: { fontSize: 11, color: BASE.textMuted, marginTop: 5 },
    wfControls: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
    wfControlBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22, borderWidth: 1,
        minHeight: 44,
        ...webInteractive,
    },
    wfControlText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
    // Section label
    sectionLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 1.5, color: BASE.textFaint, marginBottom: 7, marginTop: 2, paddingLeft: 2 },
    // Task row
    taskRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 13, paddingHorizontal: 14,
        borderRadius: 14, marginBottom: 6, borderWidth: 1,
        minHeight: 52,
        borderColor: 'rgba(140,160,200,0.07)', backgroundColor: 'rgba(140,160,200,0.025)',
        ...Platform.select({ web: { transition: 'all 160ms ease', cursor: 'pointer' } as any, default: {} }),
    },
    taskRowActive: { backgroundColor: 'rgba(0,210,255,0.05)', ...webShadow('0 0 14px rgba(0,210,255,0.07)') },
    taskRowDone: { opacity: 0.42 },
    statusDot: { width: 9, height: 9, borderRadius: 5, marginRight: 12, flexShrink: 0 },
    taskBody: { flex: 1 },
    taskTitle: { fontSize: 13, fontWeight: '700', color: BASE.text, letterSpacing: 0.1 },
    taskTitleDone: { textDecorationLine: 'line-through', color: 'rgba(0,255,170,0.35)' },
    taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    taskBadge: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    taskActionCount: { fontSize: 10, fontWeight: '600', color: BASE.textFaint },
    chevron: { fontSize: 14, color: BASE.textFaint, paddingLeft: 10, paddingVertical: 10 },
    removeBtn: { paddingHorizontal: 12, paddingVertical: 10, marginLeft: 4 },
    removeIcon: { fontSize: 18, color: 'rgba(255,255,255,0.18)', fontWeight: '200' },
    // Actions timeline (expanded)
    actionsContainer: {
        marginTop: 8, marginLeft: 17, paddingLeft: 10,
        borderLeftWidth: 1, borderLeftColor: 'rgba(140,160,200,0.10)', paddingBottom: 2,
    },
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5, minHeight: 30 },
    actionDot: { width: 6, height: 6, borderRadius: 3, marginLeft: -3 },
    actionText: { fontSize: 11, color: 'rgba(255,255,255,0.38)', flex: 1 },
    actionDoneText: { textDecorationLine: 'line-through', color: 'rgba(0,255,170,0.25)' },
    actionActiveText: { color: '#00d2ff', fontWeight: '700' },
    actionCheck: { fontSize: 9, color: '#00ffaa', marginLeft: 3 },
    // Empty state
    emptyWrap: { alignItems: 'center', paddingTop: 36, gap: 8 },
    emptyIcon: { fontSize: 28, opacity: 0.22 },
    emptyText: { fontSize: 11, color: BASE.textFaint, fontWeight: '600' },
});
