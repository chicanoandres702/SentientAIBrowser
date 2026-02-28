// Feature: Tasks | Why: FAB with expandable quick-action menu for mobile task management
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { m } from './mobile-task.styles';
import { BASE } from '../../../features/ui/theme/ui.primitives';
import { quickActionStyles as s } from './MobileQuickActions.styles';

interface Props {
    accentColor: string;
    onClearAll: () => void;
    onScrollToActive: () => void;
    onToggleSort: () => void;
    sortBy: string;
}

const ACTIONS = (sort: string) => [
    { key: 'active', icon: '⚡', label: 'Go to Active', color: '#00d2ff' },
    { key: 'sort', icon: sort === 'time' ? '◆' : '⏱', label: sort === 'time' ? 'Sort: Status' : 'Sort: Time', color: BASE.warning },
    { key: 'clear', icon: '🗑', label: 'Clear All', color: BASE.danger },
];

export const MobileQuickActions: React.FC<Props> = ({
    accentColor, onClearAll, onScrollToActive, onToggleSort, sortBy,
}) => {
    const [open, setOpen] = useState(false);
    const actions = ACTIONS(sortBy);

    const handleAction = (key: string) => {
        setOpen(false);
        if (key === 'clear') onClearAll();
        else if (key === 'active') onScrollToActive();
        else if (key === 'sort') onToggleSort();
    };

    return (
        <View style={s.wrap} pointerEvents="box-none">
            {open && (
                <Animatable.View animation="fadeInUp" duration={200} style={s.menu}>
                    {actions.map((a, i) => (
                        <Animatable.View key={a.key} animation="fadeInUp" delay={i * 60} duration={200}>
                            <TouchableOpacity style={[s.action, m.shadowSm]} onPress={() => handleAction(a.key)} activeOpacity={0.7}>
                                <Text style={s.actionIcon}>{a.icon}</Text>
                                <Text style={[s.actionLabel, { color: a.color }]}>{a.label}</Text>
                            </TouchableOpacity>
                        </Animatable.View>
                    ))}
                </Animatable.View>
            )}

            <TouchableOpacity
                style={[s.fab, m.shadow, { backgroundColor: accentColor }]}
                onPress={() => setOpen(!open)}
                activeOpacity={0.8}
            >
                <Animatable.Text
                    animation={open ? undefined : 'pulse'}
                    iterationCount="infinite"
                    duration={2000}
                    style={s.fabIcon}
                >
                    {open ? '✕' : '⚡'}
                </Animatable.Text>
            </TouchableOpacity>
        </View>
    );
};
