// Feature: Tasks | Why: Command layout styles — page labels, prompt hero, hierarchy tree connectors
import { StyleSheet } from 'react-native';
import { BASE } from '../../../features/ui/theme/ui.primitives';
import { MOBILE } from './mobile-task.styles';

export const commandStyles = StyleSheet.create({
    pageLabel: {
        paddingHorizontal: MOBILE.pad,
        paddingVertical: 8,
    },
    empty: {
        alignItems: 'center',
        paddingTop: 60,
    },
    promptPage: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: MOBILE.pad,
    },
    promptHero: {
        alignItems: 'center',
        marginBottom: 24,
    },
    promptInputWrap: {
        marginHorizontal: 4,
    },
    missionSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: MOBILE.pad,
        paddingTop: 12,
        paddingBottom: 4,
    },
    missionSectionDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    missionSectionTitle: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    missionSectionMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 3,
    },
    missionSectionTrack: {
        flex: 1,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 1,
        overflow: 'hidden',
    },
    missionSectionFill: {
        height: '100%',
        borderRadius: 1,
    },
    missionSectionPct: {
        fontSize: 8,
        fontWeight: '800',
    },
    indentedCard: {
        flexDirection: 'row',
        paddingLeft: 4,
    },
    treeConnector: {
        width: 20,
        position: 'relative',
        marginLeft: MOBILE.pad,
    },
    treeVert: {
        position: 'absolute',
        left: 3,
        top: 0,
        width: 1,
        height: '50%',
    },
    treeVertFull: {
        height: '100%',
    },
    treeHoriz: {
        position: 'absolute',
        left: 3,
        top: '50%',
        width: 14,
        height: 1,
    },
});
