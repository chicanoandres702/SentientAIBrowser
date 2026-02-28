// Feature: Tasks | Why: Additional styles for Focus layout — sub-actions, nav, empty, bottom sections
import { StyleSheet, Platform } from 'react-native';
import { BASE } from '../../../features/ui/theme/ui.primitives';
import { MOBILE } from './mobile-task.styles';

export const focusExtraStyles = StyleSheet.create({
    card: { flex: 1, borderWidth: 1, padding: 20 },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: MOBILE.radiusPill, borderWidth: 1,
    },
    statusLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
    cardTitle: { fontSize: 18, fontWeight: '900', color: BASE.text, letterSpacing: 0.3, marginTop: 16, lineHeight: 24 },
    timingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
    },
    subSection: {
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
    },
    subRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 4,
    },
    subDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    navRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    navBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    navIcon: {
        fontSize: 14,
        fontWeight: '900',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bottom: {
        paddingHorizontal: MOBILE.pad,
        paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    },
    bottomRow: {
        flexDirection: 'row',
        gap: 8,
    },
    bottomBtn: {
        flex: 1,
        height: 44,
        borderRadius: MOBILE.radiusSm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bottomBtnText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#000',
        letterSpacing: 0.5,
    },
    bottomBtnGhost: {
        height: 44,
        paddingHorizontal: 16,
        borderRadius: MOBILE.radiusSm,
        borderWidth: 1,
        borderColor: BASE.dangerSoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
