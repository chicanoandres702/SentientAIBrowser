// Feature: Tasks | Why: Styles for swipeable mobile task card — keeps card component under 100 lines
import { StyleSheet } from 'react-native';
import { BASE } from '../../../features/ui/theme/ui.primitives';
import { MOBILE } from './mobile-task.styles';

export const cardStyles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: BASE.inputBg,
        borderRadius: MOBILE.radiusSm,
        borderWidth: 1,
        borderColor: BASE.borderFocusStrong,
        marginHorizontal: MOBILE.pad,
        marginBottom: MOBILE.cardGap,
        overflow: 'hidden',
    },
    statusStrip: { width: 3 },
    body: {
        flex: 1,
        padding: MOBILE.padSm,
        paddingLeft: 10,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    titleLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
    },
    statusIcon: { fontSize: 12, fontWeight: '800', marginTop: 1 },
    doneTitle: { color: 'rgba(255,255,255,0.25)', textDecorationLine: 'line-through' },
    dismiss: { fontSize: 18, fontWeight: '200', color: 'rgba(255,255,255,0.15)', paddingLeft: 8 },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 6,
    },
    statusChip: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: MOBILE.radiusPill,
        borderWidth: 1,
    },
    statusChipText: { fontSize: 7, fontWeight: '800', letterSpacing: 0.5 },
    metaText: { fontSize: 8, fontWeight: '600' },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 6,
    },
    progressTrack: {
        flex: 1,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 1,
        overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 1 },
    progressPct: { fontSize: 8, fontWeight: '700' },
    subActions: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.04)',
    },
    subRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 3,
    },
    subText: { flex: 1, fontSize: 9, color: 'rgba(255,255,255,0.4)' },
    subStatusDot: { width: 5, height: 5, borderRadius: 3 },
    activeGlow: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: MOBILE.radiusSm,
        pointerEvents: 'none',
    },
});
