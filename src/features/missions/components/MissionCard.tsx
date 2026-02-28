// Feature: Missions | Why: Renders a single mission card with expandable task list
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MissionItem } from '../../../utils/browser-sync-service';
import { missionStyles as styles } from './MissionOverview.styles';
import { missionLocalStyles as ls } from './MissionOverview.local.styles';

interface Props {
    item: MissionItem;
    tasks: any[];
    isExpanded: boolean;
    onToggleExpand: () => void;
    onSelect: () => void;
    activeColor: string;
}

const statusColor = (s: string, accent: string) => s === 'completed' ? '#00ffaa' : s === 'in_progress' ? accent : s === 'failed' ? '#ff4444' : '#666';
const statusIcon = (s: string) => s === 'completed' ? '✓' : s === 'in_progress' ? '⚙' : s === 'failed' ? '✕' : '○';

export const MissionCard: React.FC<Props> = ({ item, tasks, isExpanded, onToggleExpand, onSelect, activeColor }) => {
    const total = tasks.length;
    const completed = tasks.filter((t: any) => t.status === 'completed').length;
    const inProgress = tasks.filter((t: any) => t.status === 'in_progress').length;
    const failed = tasks.filter((t: any) => t.status === 'failed').length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : item.progress;

    return (
        <View style={[styles.card, { borderColor: activeColor + '44' }]}>
            <TouchableOpacity onPress={tasks.length > 0 ? onToggleExpand : onSelect} style={{ flex: 1 }}>
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.goal} numberOfLines={1}>{item.goal}</Text>
                        {tasks.length > 0 && (
                            <Text style={[styles.taskCountText, { color: activeColor }]}>
                                {isExpanded ? '▼' : '▶'} {total} tasks
                            </Text>
                        )}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? activeColor : '#333' }]}>
                        <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                    </View>
                </View>

                {total > 0 && (
                    <View style={ls.taskStatsContainer}>
                        <View style={ls.taskStat}><Text style={ls.taskStatIcon}>✓</Text><Text style={ls.taskStatValue}>{completed}/{total}</Text></View>
                        <View style={ls.taskStat}><Text style={[ls.taskStatIcon, { color: activeColor }]}>⚙</Text><Text style={[ls.taskStatValue, { color: activeColor }]}>{inProgress}</Text></View>
                        {failed > 0 && <View style={ls.taskStat}><Text style={[ls.taskStatIcon, { color: '#ff4444' }]}>✕</Text><Text style={[ls.taskStatValue, { color: '#ff4444' }]}>{failed}</Text></View>}
                    </View>
                )}
            </TouchableOpacity>

            {isExpanded && tasks.length > 0 && (
                <View style={[ls.taskListContainer, { borderTopColor: activeColor + '22' }]}>
                    <View style={ls.taskListHeader}><Text style={[ls.taskListTitle, { color: activeColor }]}>MISSION TASKS</Text></View>
                    {tasks.map((task: any, idx: number) => (
                        <View key={task.id || idx} style={ls.taskListItem}>
                            <Text style={[ls.taskListIcon, { color: statusColor(task.status, activeColor) }]}>{statusIcon(task.status)}</Text>
                            <View style={ls.taskListContent}>
                                <Text style={ls.taskListItemTitle} numberOfLines={2}>{task.title}</Text>
                                {task.details && <Text style={ls.taskListItemDetails} numberOfLines={1}>{task.details}</Text>}
                            </View>
                        </View>
                    ))}
                </View>
            )}

            <View style={styles.cardFooter}>
                <Text style={styles.progressText}>Progress: {pct}%</Text>
                <TouchableOpacity onPress={onSelect} style={ls.selectBtn}>
                    <Text style={[ls.selectBtnText, { color: activeColor }]}>Select</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};
