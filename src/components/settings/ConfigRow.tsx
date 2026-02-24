// Feature: Settings | Trace: README.md
import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';

interface Props {
    label: string;
    sub: string;
    value: boolean;
    onToggle: (v: boolean) => void;
    accent: string;
}

export const ConfigRow = ({ label, sub, value, onToggle, accent }: Props) => (
    <View style={styles.row}>
        <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowSub}>{sub}</Text>
        </View>
        <Switch
            value={value}
            onValueChange={onToggle}
            trackColor={{ false: '#1a1a1a', true: accent }}
            thumbColor="#fff"
        />
    </View>
);

const styles = StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    rowInfo: { flex: 1, marginRight: 16 },
    rowLabel: { color: '#ccc', fontSize: 15, fontWeight: '600' },
    rowSub: { color: '#333', fontSize: 11, marginTop: 2 },
});
