// Feature: Settings | Trace: README.md
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';

type AppTheme = 'red' | 'blue';

export const ThemeSelector = ({ current, onSelect }: { current: AppTheme; onSelect: (t: AppTheme) => void }) => {
    return (
        <View style={ts.themeRow}>
            {(['red', 'blue'] as AppTheme[]).map(t => {
                const color = t === 'red' ? '#ff5c8a' : '#5aa8ff';
                const active = current === t;
                return (
                    <TouchableOpacity
                        key={t}
                        style={[
                            ts.themeCard,
                            active && { borderColor: `${color}55`, backgroundColor: `${color}14` },
                        ]}
                        onPress={() => onSelect(t)}
                    >
                        <View style={[ts.themeOrb, { backgroundColor: color, shadowColor: color }]} />
                        <View>
                            <Text style={[ts.themeLabel, active && { color }]}>{t === 'red' ? 'CRIMSON' : 'OCEAN'}</Text>
                            <Text style={ts.themeSub}>{t === 'red' ? 'Warm accent tones' : 'Cool accent tones'}</Text>
                        </View>
                        {active && <View style={[ts.activeDot, { backgroundColor: color }]} />}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const ts = StyleSheet.create({
    themeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    themeCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(140, 160, 200, 0.04)',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(140, 160, 200, 0.08)',
        gap: 10,
        ...Platform.select({
            web: { cursor: 'pointer', transition: 'all 150ms ease' } as any,
            default: {},
        }),
    },
    themeOrb: {
        width: 10,
        height: 10,
        borderRadius: 5,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
    },
    themeLabel: { color: '#b8c8e4', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
    themeSub: { color: '#4d5b75', fontSize: 9, marginTop: 1 },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginLeft: 'auto' as any,
    },
});
