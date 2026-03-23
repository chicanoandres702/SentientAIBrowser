// Feature: Settings | Why: Extracted styles for LayoutSelector — keeps component under 100 lines
import { StyleSheet, Platform } from 'react-native';

export const ls = StyleSheet.create({
    group: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 10,
    },
    option: {
        width: '48%' as any,
        borderWidth: 1,
        borderColor: 'rgba(140, 160, 200, 0.08)',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: 'rgba(140, 160, 200, 0.04)',
        ...Platform.select({
            web: { cursor: 'pointer', transition: 'all 150ms ease' } as any,
            default: {},
        }),
    },
    optionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    optionLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    optionIcon: { color: '#4d5b75', fontSize: 11 },
    optionLabel: {
        color: '#b8c8e4',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    optionSub: {
        marginTop: 3,
        color: '#4d5b75',
        fontSize: 9,
        fontWeight: '500',
    },
    activeDot: { width: 6, height: 6, borderRadius: 3 },
    tag: {
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 4,
        borderWidth: 1,
    },
    tagText: {
        fontSize: 7,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
});
