// Feature: Tasks | Why: Tree row renderer for hierarchical task tree in layout switcher
import React from 'react';
import { View, Text } from 'react-native';
import { HierarchyRow } from '../task-filter.utils';
import { STATUS_DOT } from './mobile-status.config';
import { switcherStyles as s } from './MobileLayoutSwitcher.styles';

/** Renders a single row in the hierarchical task tree — mission header or indented child task */
export const HierarchyRowView = ({ row, accent }: { row: HierarchyRow; accent: string }) => {
    if (row.type === 'mission') {
        const progress = row.totalCount > 0 ? Math.round((row.completedCount / row.totalCount) * 100) : 0;
        return (
            <View style={s.missionRow}>
                <View style={[s.missionOrb, { backgroundColor: accent }]} />
                <View style={s.missionInfo}>
                    <Text style={[s.missionTitle, { color: accent }]} numberOfLines={1}>{row.mission.title}</Text>
                    <View style={s.missionMeta}>
                        <View style={s.missionTrack}>
                            <View style={[s.missionFill, { width: `${progress}%`, backgroundColor: accent }]} />
                        </View>
                        <Text style={[s.missionPct, { color: accent }]}>{progress}%</Text>
                        <Text style={s.missionCount}>{row.completedCount}/{row.totalCount}</Text>
                    </View>
                </View>
            </View>
        );
    }

    // Task row — indented with tree connector lines
    const dot = STATUS_DOT[row.task.status];
    const chipLabel = row.task.status === 'in_progress' ? 'RUN'
        : row.task.status === 'completed' ? 'OK'
        : row.task.status === 'failed' ? 'ERR'
        : row.task.status === 'blocked_on_user' ? 'WAIT' : 'Q';

    return (
        <View style={s.taskRow}>
            <View style={s.treeLine}>
                <View style={[s.treeVert, !row.isLast && s.treeVertFull, { backgroundColor: accent + '22' }]} />
                <View style={[s.treeHoriz, { backgroundColor: accent + '22' }]} />
            </View>
            <Text style={[s.taskDot, { color: dot.color }]}>{dot.icon}</Text>
            <Text style={[s.taskTitle, row.task.status === 'completed' && s.taskDone, row.task.status === 'in_progress' && { color: accent }]} numberOfLines={1}>{row.task.title}</Text>
            <View style={[s.taskChip, { backgroundColor: dot.color + '18' }]}>
                <Text style={[s.taskChipText, { color: dot.color }]}>{chipLabel}</Text>
            </View>
        </View>
    );
};
