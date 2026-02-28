// Feature: Tasks | Why: Extracted styles for MobileFocusLayout — keeps layout file under 100 lines
import { StyleSheet, Platform } from 'react-native';
import { BASE } from '../../../features/ui/theme/ui.primitives';
import { MOBILE } from './mobile-task.styles';

export const focusStyles = StyleSheet.create({
    missionBar: {
        paddingHorizontal: MOBILE.pad,
        paddingTop: Platform.OS === 'ios' ? 50 : 12,
        paddingBottom: 8,
    },
    missionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    missionOrb: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    pct: {
        fontSize: 14,
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
    cardArea: {
        flex: 1,
        paddingHorizontal: MOBILE.pad,
    },
    breadcrumb: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 4,
        marginBottom: 4,
    },
    breadcrumbDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    breadcrumbMission: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.3,
        flex: 1,
    },
    breadcrumbArrow: {
        fontSize: 10,
        color: BASE.textFaint,
        fontWeight: '700',
    },
    breadcrumbPos: {
        fontSize: 9,
        fontWeight: '800',
        color: BASE.textMuted,
    },
    dots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 4,
        marginBottom: 10,
        flexWrap: 'wrap',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: BASE.textFaint,
    },
});
