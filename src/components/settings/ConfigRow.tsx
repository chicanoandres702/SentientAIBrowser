// Feature: Settings | Trace: README.md
import React from 'react';
import { View, Text, Switch, StyleSheet, Platform } from 'react-native';

interface Props {
    label: string;
    sub: string;
    value: boolean;
    onToggle: (v: boolean) => void;
    accent: string;
}

export const ConfigRow = ({ label, sub, value, onToggle, accent }: Props) => (
    <View style={cr.row}>
        <View style={cr.rowInfo}>
            <Text style={cr.rowLabel}>{label}</Text>
            <Text style={cr.rowSub}>{sub}</Text>
        </View>
        <Switch
            value={value}
            onValueChange={onToggle}
            trackColor={{ false: 'rgba(140, 160, 200, 0.10)', true: `${accent}88` }}
            thumbColor={value ? accent : '#6b7a96'}
            {...Platform.select({
                web: { activeThumbColor: accent } as any,
                default: {},
            })}
        />
    </View>
);

const cr = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(140, 160, 200, 0.06)',
    },
    rowInfo: { flex: 1, marginRight: 16 },
    rowLabel: { color: '#b8c8e4', fontSize: 13, fontWeight: '600' },
    rowSub: { color: '#4d5b75', fontSize: 11, marginTop: 2 },
});
