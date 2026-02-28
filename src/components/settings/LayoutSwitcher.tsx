// Feature: UI | Why: Layout switcher — lean orchestrator importing data + styles + modal
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LayoutMode } from '../../hooks/useBrowserState';
import { LAYOUTS } from './layout-options.data';
import { switcherStyles as s } from './LayoutSwitcher.styles';
import { LayoutPickerModal } from './LayoutPickerModal';

interface Props {
    current: LayoutMode;
    onSelect: (mode: LayoutMode) => void;
    accent: string;
    isDesktop: boolean;
}

/** Compact inline switcher for the header bar */
export const LayoutSwitcherInline: React.FC<Props> = ({ current, onSelect, accent, isDesktop }) => {
    const [expanded, setExpanded] = useState(false);
    const active = LAYOUTS.find(l => l.mode === current);

    if (!isDesktop) {
        return (
            <>
                <TouchableOpacity
                    style={[s.trigger, { borderColor: `${accent}44` }]}
                    onPress={() => setExpanded(true)}
                >
                    <Text style={[s.triggerIcon, { color: accent }]}>{active?.icon}</Text>
                    <Text style={[s.triggerLabel, { color: accent }]}>{active?.label?.toUpperCase()}</Text>
                </TouchableOpacity>
                <LayoutPickerModal
                    visible={expanded}
                    current={current}
                    accent={accent}
                    onSelect={onSelect}
                    onClose={() => setExpanded(false)}
                />
            </>
        );
    }

    // Desktop: inline pill strip
    return (
        <View style={s.strip}>
            {LAYOUTS.map(l => {
                const isActive = l.mode === current;
                return (
                    <TouchableOpacity
                        key={l.mode}
                        style={[s.chip, isActive && { backgroundColor: `${accent}20`, borderColor: `${accent}55` }]}
                        onPress={() => onSelect(l.mode)}
                    >
                        <Text style={[s.chipIcon, isActive && { color: accent }]}>{l.icon}</Text>
                        <Text style={[s.chipLabel, isActive && { color: accent }]}>
                            {l.label.toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};
