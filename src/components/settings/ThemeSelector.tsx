// Feature: Settings | Trace: README.md
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppTheme } from '../../App';

export const ThemeSelector = ({ current, onSelect }: { current: AppTheme; onSelect: (t: AppTheme) => void }) => {
    return (
        <View style={styles.themeRow}>
            {(['red', 'blue'] as AppTheme[]).map(t => (
                <TouchableOpacity
                    key={t}
                    style={[styles.themeCard, current === t && { borderColor: t === 'red' ? '#ff003c' : '#00d2ff' }]}
                    onPress={() => onSelect(t)}
                >
                    <View style={[styles.themeOrb, { backgroundColor: t === 'red' ? '#ff003c' : '#00d2ff', shadowColor: t === 'red' ? '#ff003c' : '#00d2ff' }]} />
                    <Text style={styles.themeLabel}>{t === 'red' ? 'CRIMSON' : 'OCEAN'}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    themeRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    themeCard: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0d0d0d', padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#1a1a1a', gap: 10 },
    themeOrb: { width: 14, height: 14, borderRadius: 7, shadowRadius: 6 },
    themeLabel: { color: '#ccc', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
});
