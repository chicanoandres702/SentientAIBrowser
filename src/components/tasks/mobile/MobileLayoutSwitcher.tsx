// Feature: Tasks | Why: Layout switcher with hierarchical task tree preview under active variant
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { TaskItem } from '../../../features/tasks/types';
import { useHierarchicalTasks } from '../task-filter.utils';
import { MOBILE } from './mobile-task.styles';
import { switcherStyles as s } from './MobileLayoutSwitcher.styles';
import { HierarchyRowView } from './HierarchyRowView';

export type MobileLayoutVariant = 'command' | 'stream' | 'focus';

const VARIANTS: { key: MobileLayoutVariant; icon: string; label: string; desc: string }[] = [
    { key: 'command', icon: '📋', label: 'COMMAND', desc: 'Tabbed pages' },
    { key: 'stream', icon: '🌊', label: 'STREAM', desc: 'Infinite feed' },
    { key: 'focus', icon: '🎯', label: 'FOCUS', desc: 'One at a time' },
];

interface Props {
    active: MobileLayoutVariant;
    onSelect: (v: MobileLayoutVariant) => void;
    accentColor: string;
    tasks?: TaskItem[];
}

export const MobileLayoutSwitcher: React.FC<Props> = ({ active, onSelect, accentColor, tasks = [] }) => {
    const hierarchy = useHierarchicalTasks(tasks, 'all', 'time');

    return (
        <View>
            {/* Variant selector row */}
            <View style={s.row}>
                {VARIANTS.map(v => {
                    const isActive = active === v.key;
                    return (
                        <TouchableOpacity
                            key={v.key}
                            style={[s.option, isActive && { backgroundColor: accentColor + '18', borderColor: accentColor }]}
                            onPress={() => onSelect(v.key)}
                            activeOpacity={0.7}
                        >
                            <Text style={s.icon}>{v.icon}</Text>
                            <Text style={[s.label, isActive && { color: accentColor }]}>{v.label}</Text>
                            <Text style={s.desc}>{v.desc}</Text>
                            {isActive && <View style={[s.activeBar, { backgroundColor: accentColor }]} />}
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Hierarchical task tree under the active variant */}
            {hierarchy.length > 0 && (
                <Animatable.View animation="fadeIn" duration={250} style={s.treeWrap}>
                    <ScrollView horizontal={false} showsVerticalScrollIndicator={false} style={s.treeScroll} nestedScrollEnabled>
                        {hierarchy.map((row) => (
                            <HierarchyRowView key={row.type === 'mission' ? row.mission.id : row.task.id} row={row} accent={accentColor} />
                        ))}
                    </ScrollView>
                </Animatable.View>
            )}
        </View>
    );
};
