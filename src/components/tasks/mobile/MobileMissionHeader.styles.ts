// Feature: Tasks | Why: Styles for mobile mission header — sticky collapsible banner
import { StyleSheet } from 'react-native';
import { BASE } from '../../../features/ui/theme/ui.primitives';
import { MOBILE } from './mobile-task.styles';

export const missionHeaderStyles = StyleSheet.create({
    container: {
        marginHorizontal: MOBILE.pad,
        marginTop: MOBILE.padSm,
        marginBottom: MOBILE.padXs,
    },
    idle: {
        marginHorizontal: MOBILE.pad,
        marginTop: MOBILE.padSm,
        padding: MOBILE.pad,
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: MOBILE.pad,
    },
    headerLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    headerRight: { alignItems: 'flex-end', gap: 2 },
    orb: { width: 8, height: 8, borderRadius: 4, marginTop: 3 },
    progressText: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
    progressTrack: {
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.06)',
        marginHorizontal: MOBILE.pad,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 2 },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
        paddingHorizontal: MOBILE.padSm,
    },
    statChip: { alignItems: 'center', gap: 1 },
    statValue: { fontSize: 14, fontWeight: '900' },
    statLabel: {
        fontSize: 7,
        fontWeight: '700',
        color: BASE.textFaint,
        letterSpacing: 0.6,
    },
});
