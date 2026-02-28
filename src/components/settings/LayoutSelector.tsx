// Feature: Settings | Why: Layout mode picker — renders 8 layout options in a grid
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LayoutMode } from '../../hooks/useBrowserState';
import { ls } from './LayoutSelector.styles';

type Props = { current: LayoutMode; onSelect: (mode: LayoutMode) => void; accent: string };

const OPTIONS: Array<{ mode: LayoutMode; label: string; sub: string; icon: string; tag?: string }> = [
    { mode: 'standard', label: 'STANDARD', sub: 'Balanced browser + panel', icon: '◫' },
    { mode: 'compact', label: 'COMPACT', sub: 'Dense minimal chrome layout', icon: '▬', tag: 'SLIM' },
    { mode: 'focus', label: 'FOCUS', sub: 'Content-first clean preview', icon: '▣' },
    { mode: 'split', label: 'SPLIT', sub: 'Side-by-side equal panels', icon: '◧' },
    { mode: 'cockpit', label: 'COCKPIT', sub: 'Left command center bay', icon: '⌬' },
    { mode: 'stack', label: 'STACK', sub: 'Vertical preview + mission rail', icon: '☰' },
    { mode: 'dashboard', label: 'DASHBOARD', sub: 'Multi-panel grid overview', icon: '⊞', tag: 'NEW' },
    { mode: 'zen', label: 'ZEN', sub: 'Immersive distraction-free canvas', icon: '◉' },
];

export const LayoutSelector: React.FC<Props> = ({ current, onSelect, accent }) => (
    <View style={ls.group}>
        {OPTIONS.map((o) => {
            const active = o.mode === current;
            return (
                <TouchableOpacity key={o.mode} onPress={() => onSelect(o.mode)} style={[ls.option, active && { borderColor: `${accent}55`, backgroundColor: `${accent}14` }]}>
                    <View style={ls.optionHeader}>
                        <View style={ls.optionLabelRow}>
                            <Text style={[ls.optionIcon, active && { color: accent }]}>{o.icon}</Text>
                            <Text style={[ls.optionLabel, active && { color: accent }]}>{o.label}</Text>
                        </View>
                        {o.tag && <View style={[ls.tag, { backgroundColor: `${accent}20`, borderColor: `${accent}33` }]}><Text style={[ls.tagText, { color: accent }]}>{o.tag}</Text></View>}
                        {active && !o.tag && <View style={[ls.activeDot, { backgroundColor: accent }]} />}
                    </View>
                    <Text style={ls.optionSub}>{o.sub}</Text>
                </TouchableOpacity>
            );
        })}
    </View>
);
