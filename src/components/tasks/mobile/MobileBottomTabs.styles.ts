// Feature: Tasks | Why: Styles for the mobile bottom tab bar navigation
import { StyleSheet } from 'react-native';
import { MOBILE } from './mobile-task.constants';
import { BASE, webGlass } from '../../../features/ui/theme/ui.primitives';

export const bottomTabStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        height: MOBILE.tabBarH,
        backgroundColor: BASE.panelGlass,
        borderTopWidth: 1,
        borderTopColor: BASE.borderSubtle,
        ...webGlass(16),
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        borderTopWidth: 2,
        borderTopColor: 'transparent',
    },
    iconWrap: { position: 'relative' },
    icon: { fontSize: 18 },
    badge: {
        position: 'absolute',
        top: -4,
        right: -10,
        minWidth: 16,
        height: 14,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 3,
    },
    badgeText: {
        fontSize: 8,
        fontWeight: '900',
        color: '#000',
    },
    label: {
        fontSize: 8,
        fontWeight: '700',
        color: BASE.textFaint,
        letterSpacing: 0.6,
    },
});
