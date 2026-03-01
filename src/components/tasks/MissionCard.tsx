// Feature: Tasks UI | Trace: README.md
import React from 'react';
import { View, Text } from 'react-native';
import { TaskItem } from '../../features/tasks/types';
import { missionStyles } from './TaskQueueUI.styles';
import { TaskItemView } from './TaskItemView';
import type { MissionNode } from './mission-nodes.utils';

interface Props {
    node: MissionNode;
    accentColor: string;
    removeTask: (id: string) => void;
    editTask: (id: string, t: string) => void;
}

export const MissionCard: React.FC<Props> = ({ node, accentColor, removeTask, editTask }) => (
    <View style={[missionStyles.card, { borderColor: accentColor + '44' }]}>
        <Text style={[missionStyles.label, { color: accentColor }]}>📋 MISSION</Text>
        <Text style={missionStyles.title} numberOfLines={2}>{node.mission.title.toUpperCase()}</Text>
        <View style={missionStyles.progressRow}>
            <View style={missionStyles.track}>
                <View style={[missionStyles.bar, { width: `${node.mission.progress || 0}%`, backgroundColor: accentColor }]} />
            </View>
            <Text style={[missionStyles.pct, { color: accentColor }]}>{node.mission.progress || 0}%</Text>
        </View>
        <Text style={missionStyles.details}>{node.completedCount}/{node.totalCount} tasks done{node.mission.details ? ` · ${node.mission.details}` : ''}</Text>
        <View style={missionStyles.childList}>
            {node.children.map((child: TaskItem) => (
                <View key={child.id} style={missionStyles.childItem}>
                    <TaskItemView item={child} accentColor={accentColor} removeTask={removeTask} editTask={editTask} />
                </View>
            ))}
        </View>
    </View>
);
