// Feature: Tasks | Why: Styles for the FAB quick-action menu component
import { StyleSheet } from 'react-native';
import { MOBILE } from './mobile-task.constants';
import { BASE } from '../../../features/ui/theme/ui.primitives';

export const quickActionStyles = StyleSheet.create({
    wrap: {
        position: 'absolute',
        bottom: MOBILE.tabBarH + 12,
        right: MOBILE.pad,
        alignItems: 'flex-end',
    },
    fab: {
        width: MOBILE.fabSize,
        height: MOBILE.fabSize,
        borderRadius: MOBILE.fabSize / 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fabIcon: {
        fontSize: 22,
        color: '#000',
        fontWeight: '900',
    },
    menu: {
        marginBottom: 10,
        gap: 6,
        alignItems: 'flex-end',
    },
    action: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: BASE.panelGlass,
        borderRadius: MOBILE.radiusPill,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: BASE.borderFocusStrong,
    },
    actionIcon: {
        fontSize: 14,
    },
    actionLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});
