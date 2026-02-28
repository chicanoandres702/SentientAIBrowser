// Feature: Tasks | Why: Stream layout tree + footer styles — hierarchy connectors, empty state, clear button
import { StyleSheet } from 'react-native';
import { BASE } from '../../../features/ui/theme/ui.primitives';
import { MOBILE } from './mobile-task.styles';

export const streamExtraStyles = StyleSheet.create({
    sortToggle: {
        paddingHorizontal: 8, paddingVertical: 4,
        borderRadius: MOBILE.radiusSm, borderWidth: 1, borderColor: BASE.borderFocusStrong,
    },
    sortText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },
    empty: {
        alignItems: 'center',
        paddingTop: 60,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    clearBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: MOBILE.radiusPill,
        borderWidth: 1,
        borderColor: BASE.dangerSoft,
    },
    /* ── Hierarchical stream rows ── */
    streamMissionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: MOBILE.pad,
        paddingTop: 14,
        paddingBottom: 4,
    },
    streamMissionDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    streamMissionMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 3,
    },
    streamMissionTrack: {
        flex: 1,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 1,
        overflow: 'hidden',
    },
    streamMissionFill: {
        height: '100%',
        borderRadius: 1,
    },
    streamMissionLabel: {
        fontSize: 8,
        fontWeight: '800',
    },
    streamIndent: {
        flexDirection: 'row',
        paddingLeft: 4,
    },
    streamTree: {
        width: 20,
        position: 'relative',
        marginLeft: MOBILE.pad,
    },
    streamTreeVert: {
        position: 'absolute',
        left: 3,
        top: 0,
        width: 1,
        height: '50%',
    },
    streamTreeVertFull: {
        height: '100%',
    },
    streamTreeHoriz: {
        position: 'absolute',
        left: 3,
        top: '50%',
        width: 14,
        height: 1,
    },
});
