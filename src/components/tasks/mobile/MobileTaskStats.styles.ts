// Feature: Tasks | Why: Styles for stats dashboard — ring, grid tiles, timeline
import { StyleSheet } from 'react-native';
import { BASE } from '../../../features/ui/theme/ui.primitives';
import { MOBILE } from './mobile-task.styles';

export const statsStyles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: MOBILE.pad,
        paddingTop: MOBILE.padSm,
    },
    ringCard: {
        alignItems: 'center',
        paddingVertical: 20,
        marginBottom: MOBILE.padSm,
    },
    ringOuter: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ringInner: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 40,
        borderWidth: 3,
    },
    ringCenter: { flexDirection: 'row', alignItems: 'baseline' },
    ringValue: { fontSize: 26, fontWeight: '900' },
    ringUnit: { fontSize: 12, fontWeight: '700', color: BASE.textMuted },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: MOBILE.padSm,
    },
    tile: {
        width: '31%',
        backgroundColor: BASE.inputBg,
        borderRadius: MOBILE.radiusSm,
        borderWidth: 1,
        padding: 10,
        alignItems: 'center',
        gap: 3,
    },
    tileValue: { fontSize: 18, fontWeight: '900' },
    tileLabel: {
        fontSize: 7,
        fontWeight: '700',
        color: BASE.textFaint,
        letterSpacing: 0.6,
    },
    timeline: { padding: MOBILE.pad },
    timelineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 4,
    },
});
