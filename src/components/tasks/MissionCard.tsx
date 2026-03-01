// Feature: Tasks UI | Why: Mission card with controls, drag reorder, and tap-to-activate subtasks
import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { TaskItem } from '../../features/tasks/types';
import { missionStyles as ms } from './TaskQueueUI.styles';
import { TaskItemView } from './TaskItemView';
import { MissionQueueControls } from './MissionQueueControls';
import type { MissionNode } from './mission-nodes.utils';

export interface MissionCardActions {
    isPaused: boolean;
    onPlay: () => void;
    onPause: () => void;
    /** Pause + open save-routine prompt */
    onStop: () => void;
    /** Open save-routine prompt without stopping */
    onSave: () => void;
    /** Promote a pending child to in_progress */
    onActivateTask: (id: string) => void;
    onMoveUp: (() => void) | null;
    onMoveDown: (() => void) | null;
}

interface Props {
    node: MissionNode;
    accentColor: string;
    removeTask: (id: string) => void;
    editTask: (id: string, t: string) => void;
    actions?: MissionCardActions;
    isDropTarget?: boolean;
    dragProps?: Record<string, any>;
}

export const MissionCard: React.FC<Props> = ({
    node, accentColor, removeTask, editTask, actions, isDropTarget, dragProps,
}) => {
    const isActive = node.children.some(c => c.status === 'in_progress');
    const isDone = node.mission.status === 'completed';
    // Why: liveProgress is computed from counted child completions, not a stored field.
    // node.mission.progress can lag if Cloud Run updates Firestore faster than recalcMissionProgress runs.
    // completedCount/totalCount is always freshly derived by useMissionNodes from current task statuses.
    const liveProgress = node.totalCount > 0
        ? Math.round((node.completedCount / node.totalCount) * 100)
        : (node.mission.progress || 0);
    const borderColor = isDropTarget ? accentColor
        : isActive ? accentColor + 'cc'
        : isDone ? 'rgba(0,255,120,0.3)'
        : accentColor + '44';

    return (
        <View
            style={[ms.card, isActive && ms.activeCard, isDropTarget && ms.dropTarget, { borderColor }]}
            {...(Platform.OS === 'web' ? dragProps : {})}
        >
            <View style={ms.cardHeader}>
                {/* Drag handle — web DnD visual affordance */}
                {Platform.OS === 'web' && dragProps && (
                    <Text style={[ms.dragHandle, { color: 'rgba(255,255,255,0.2)', fontSize: 14 }]}>⠿</Text>
                )}
                {/* Up/Down arrow reorder (mobile + web fallback) */}
                {actions && (actions.onMoveUp || actions.onMoveDown) && (
                    <View style={ms.reorderBtns}>
                        <TouchableOpacity style={ms.reorderBtn} onPress={actions.onMoveUp ?? undefined} disabled={!actions.onMoveUp}>
                            <Text style={ms.reorderIcon}>▲</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={ms.reorderBtn} onPress={actions.onMoveDown ?? undefined} disabled={!actions.onMoveDown}>
                            <Text style={ms.reorderIcon}>▼</Text>
                        </TouchableOpacity>
                    </View>
                )}
                <View style={{ flex: 1 }}>
                    <Text style={[ms.label, { color: isActive ? accentColor : isDone ? '#00ff78' : accentColor + '88' }]}>
                        {isActive ? '⚡ ACTIVE MISSION' : isDone ? '✓ COMPLETED' : '📋 MISSION'}
                    </Text>
                    <Text style={ms.title} numberOfLines={2}>{node.mission.title.toUpperCase()}</Text>
                </View>
            </View>

            <View style={ms.progressRow}>
                <View style={ms.track}>
                    <View style={[
                        ms.bar,
                        { width: `${liveProgress}%` as any, backgroundColor: isDone ? '#00ffaa' : isActive ? accentColor : '#555' },
                        // Why: smooth animated fill as subtasks complete
                        Platform.OS === 'web' && { transition: 'width 0.5s ease, background-color 0.4s ease' } as any,
                        isDone && Platform.OS === 'web' && { boxShadow: '0 0 10px rgba(0,255,170,0.5)' } as any,
                    ]} />
                </View>
                <Text style={[ms.pct, { color: isDone ? '#00ffaa' : accentColor, fontWeight: '900' }]}>
                    {isDone ? '✓' : `${liveProgress}%`}
                </Text>
            </View>
            {/* Why: completedCount/totalCount updates live as each child task finishes */}
            <Text style={ms.details}>
                {node.completedCount}/{node.totalCount} tasks{isDone ? ' · All complete ✓' : isActive ? ` · ${node.mission.details || 'In progress'}` : ` · ${node.mission.details || 'In queue'}`}
            </Text>

            {actions && (
                <MissionQueueControls
                    missionId={node.mission.id}
                    isActive={isActive}
                    isPaused={actions.isPaused}
                    onPlay={actions.onPlay}
                    onPause={actions.onPause}
                    onStop={actions.onStop}
                    onSave={actions.onSave}
                    accentColor={accentColor}
                />
            )}

            <View style={ms.childList}>
                {node.children.map((child: TaskItem) => (
                    // Tap a pending child to promote it — makes it the active task
                    <TouchableOpacity
                        key={child.id}
                        style={ms.childItem}
                        onPress={child.status === 'pending' && actions ? () => actions.onActivateTask(child.id) : undefined}
                        activeOpacity={child.status === 'pending' && actions ? 0.6 : 1}
                    >
                        <TaskItemView item={child} accentColor={accentColor} removeTask={removeTask} editTask={editTask} />
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};
