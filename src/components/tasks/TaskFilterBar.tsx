// Feature: Tasks | Why: Perf-optimized filter bar — React.memo + useCallback prevent re-renders
import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FilterType, SortMode } from './task-filter.utils';
import { BASE } from '../../features/ui/theme/ui.theme';
import { filterBarStyles as st, activeBtnStyle, activeTextStyle } from './TaskFilterBar.styles';

interface FilterBarProps {
    filterType: FilterType;
    setFilterType: (f: FilterType) => void;
    sortBy: SortMode;
    setSortBy: (s: SortMode) => void;
    stats: { active: number; completed: number; failed: number };
    accentColor: string;
}

/** Memoized filter pills + sort toggle — only re-renders when own props change */
export const TaskFilterBar = React.memo<FilterBarProps>(({ filterType, setFilterType, sortBy, setSortBy, stats, accentColor }) => {
    const toggleSort = useCallback(() => setSortBy(sortBy === 'time' ? 'status' : 'time'), [sortBy, setSortBy]);
    return (
        <>
            <View style={st.filterRow}>
                <Pill value="all" label="ALL" active={filterType === 'all'} color={accentColor} onSelect={setFilterType} />
                <Pill value="active" label={`ACTIVE (${stats.active})`} active={filterType === 'active'} color={accentColor} onSelect={setFilterType} />
                <Pill value="completed" label={`✓ (${stats.completed})`} active={filterType === 'completed'} color={BASE.success} onSelect={setFilterType} />
                <Pill value="failed" label={`✕ (${stats.failed})`} active={filterType === 'failed'} color={BASE.danger} onSelect={setFilterType} />
            </View>
            <View style={st.sortRow}>
                <TouchableOpacity onPress={toggleSort} style={st.sortBtn}>
                    <Text style={[st.sortText, activeTextStyle(accentColor)]}>{sortBy === 'time' ? '⏱ TIME' : '◆ STATUS'}</Text>
                </TouchableOpacity>
            </View>
        </>
    );
});

interface PillProps { value: FilterType; label: string; active: boolean; color: string; onSelect: (f: FilterType) => void }

/** Memoized pill — stable onSelect ref means inactive pills skip re-render entirely */
const Pill = React.memo<PillProps>(({ value, label, active, color, onSelect }) => {
    const handlePress = useCallback(() => onSelect(value), [onSelect, value]);
    return (
        <TouchableOpacity onPress={handlePress} style={[st.filterBtn, active && activeBtnStyle(color)]}>
            <Text style={[st.filterText, active && activeTextStyle(color)]}>{label}</Text>
        </TouchableOpacity>
    );
});
