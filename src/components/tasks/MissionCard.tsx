// Feature: Tasks UI | Trace: src/components/tasks/MissionCard.tsx
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
  onStop: () => void;
  onSave: () => void;
  onActivateTask: (id: string) => void;
  onMoveUp: (() => void) | null;
  onMoveDown: (() => void) | null;
  /** Retry a failed task — resets status to pending and resumes the mission loop */
  onRetryTask?: (id: string) => void;
  /** Allow-me — sets task to blocked_on_user so the user can complete it manually */
  onAllowMe?: (id: string) => void;
  /** Trigger AI replanner to assess current page and extend the plan */
  onExtendPlan?: () => void;
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

export const MissionCard: React.FC<Props> = ({ node, accentColor, removeTask, editTask, actions, isDropTarget, dragProps }) => {
  const isActive = node.children.some((c) => c.status === 'in_progress');
  const isDone = node.mission.status === 'completed';
  const liveProgress = node.totalCount > 0 ? Math.round((node.completedCount / node.totalCount) * 100) : node.mission.progress || 0;
  const borderColor = isDropTarget ? accentColor : isActive ? accentColor + 'cc' : isDone ? 'rgba(0,255,120,0.3)' : accentColor + '44';
  const statusLabel = isActive ? '⚡ ACTIVE MISSION' : isDone ? '✓ COMPLETED' : '📋 MISSION';
  const statusColor = isActive ? accentColor : isDone ? '#00ff78' : accentColor + '88';
  const progressColor = isDone ? '#00ffaa' : isActive ? accentColor : '#555';

  return (
    <View style={[ms.card, isActive && ms.activeCard, isDropTarget && ms.dropTarget, { borderColor }]} {...(Platform.OS === 'web' ? dragProps : {})}>
      <View style={ms.cardHeader}>
        {Platform.OS === 'web' && dragProps && <Text style={[ms.dragHandle, { color: 'rgba(255,255,255,0.2)', fontSize: 14 }]}>⠿</Text>}
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
          <Text style={[ms.label, { color: statusColor }]}>{statusLabel}</Text>
          <Text style={ms.title} numberOfLines={2}>
            {node.mission.title.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={ms.progressRow}>
        <View style={ms.track}>
          <View style={[ms.bar, { width: `${liveProgress}%`, backgroundColor: progressColor }]} />
        </View>
        <Text style={[ms.pct, { color: isDone ? '#00ffaa' : accentColor, fontWeight: '900' }]}>{isDone ? '✓' : `${liveProgress}%`}</Text>
      </View>

      <Text style={ms.details}>
        {node.completedCount}/{node.totalCount} tasks{isDone ? ' · All complete ✓' : isActive ? ` · ${node.mission.details || 'In progress'}` : ` · ${node.mission.details || 'In queue'}`}
      </Text>

      {actions && <MissionQueueControls missionId={node.mission.id} isActive={isActive} isPaused={actions.isPaused} onPlay={actions.onPlay} onPause={actions.onPause} onStop={actions.onStop} onSave={actions.onSave} onExtendPlan={actions.onExtendPlan} accentColor={accentColor} />}

      <View style={ms.childList}>
        {node.children.map((child: TaskItem) => (
          <TouchableOpacity key={child.id} style={ms.childItem} onPress={child.status === 'pending' && actions ? () => actions.onActivateTask(child.id) : undefined} activeOpacity={child.status === 'pending' && actions ? 0.6 : 1}>
            <TaskItemView item={child} accentColor={accentColor} removeTask={removeTask} editTask={editTask} onPlay={child.status==='pending'&&actions?()=>actions.onActivateTask(child.id):undefined} onRetry={actions?.onRetryTask?()=>actions.onRetryTask!(child.id):undefined} onAllowMe={actions?.onAllowMe?()=>actions.onAllowMe!(child.id):undefined} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
