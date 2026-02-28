// Feature: Tasks | Why: Stream layout styles — prompt bar, mission strip, controls, hierarchy connectors
import { StyleSheet, Platform } from 'react-native';
import { BASE } from '../../../features/ui/theme/ui.primitives';
import { MOBILE } from './mobile-task.styles';

export const streamStyles = StyleSheet.create({
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: MOBILE.pad,
        paddingTop: Platform.OS === 'ios' ? 50 : 12,
        paddingBottom: 8,
    },
    promptBar: {
        flexDirection: 'row',
        marginHorizontal: MOBILE.pad,
        marginBottom: 8,
        borderRadius: MOBILE.radiusPill,
        overflow: 'hidden',
    },
    promptInput: {
        flex: 1,
        height: 42,
        paddingHorizontal: 16,
        color: BASE.text,
        fontSize: 12,
        fontWeight: '600',
    },
    sendBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendIcon: {
        fontSize: 18,
        fontWeight: '900',
        color: '#000',
    },
    missionStrip: {
        marginHorizontal: MOBILE.pad,
        marginBottom: 8,
        padding: 10,
        backgroundColor: BASE.inputBg,
        borderRadius: MOBILE.radiusSm,
        borderWidth: 1,
        borderColor: BASE.borderSubtle,
    },
    missionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    missionDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    missionPct: {
        fontSize: 12,
        fontWeight: '900',
    },
    missionTrack: {
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 1,
        marginTop: 6,
        overflow: 'hidden',
    },
    missionFill: {
        height: '100%',
        borderRadius: 1,
    },
    controlRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: MOBILE.pad,
        paddingVertical: 6,
    },
    statPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: MOBILE.radiusPill,
        borderWidth: 1,
        marginRight: 4,
    },
    statValue: {
        fontSize: 10,
        fontWeight: '800',
    },
});
