// Feature: Tasks | Why: Filter bar extracted for reusability and 100-line compliance
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FilterType, SortMode } from './task-filter.utils';
import { BASE } from '../../features/ui/theme/ui.theme';
import { filterBarStyles as s } from './TaskFilterBar.styles';

interface FilterBarProps {
    filterType: FilterType;
    setFilterType: (f: FilterType) => void;
    sortBy: SortMode;
    setSortBy: (s: SortMode) => void;
    stats: { active: number; completed: number; failed: number };
    accentColor: string;
}

/** Horizontal filter pills + sort toggle for the task queue */
export const TaskFilterBar: React.FC<FilterBarProps> = ({
    filterType, setFilterType, sortBy, setSortBy, stats, accentColor,
}) => (
    <>
        <View style={s.filterRow}>
            <Pill label="ALL" active={filterType === 'all'} color={accentColor} onPress={() => setFilterType('all')} />
            <Pill label={`ACTIVE (${stats.active})`} active={filterType === 'active'} color={accentColor} onPress={() => setFilterType('active')} />
            <Pill label={`✓ (${stats.completed})`} active={filterType === 'completed'} color={BASE.success} onPress={() => setFilterType('completed')} />
            <Pill label={`✕ (${stats.failed})`} active={filterType === 'failed'} color={BASE.danger} onPress={() => setFilterType('failed')} />
        </View>
        <View style={s.sortRow}>
            <TouchableOpacity onPress={() => setSortBy(sortBy === 'time' ? 'status' : 'time')} style={s.sortBtn}>
                <Text style={[s.sortText, { color: accentColor }]}>{sortBy === 'time' ? '⏱ TIME' : '◆ STATUS'}</Text>
            </TouchableOpacity>
        </View>
    </>
);

const Pill = ({ label, active, color, onPress }: { label: string; active: boolean; color: string; onPress: () => void }) => (
    <TouchableOpacity
        onPress={onPress}
        style={[s.filterBtn, active && { backgroundColor: color + '22', borderColor: color }]}
    >
        <Text style={[s.filterText, active && { color }]}>{label}</Text>
    </TouchableOpacity>
);
