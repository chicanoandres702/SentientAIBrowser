// Feature: Tasks | Trace: src/components/tasks/TaskItemView.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { TaskItem, TaskStatus, SubAction } from '../../features/tasks/types';
import { styles } from './TaskQueueUI.styles';
import { TaskProgressBar } from '@features/tasks';
import { getElapsedTime, getStatusBadge, taskItemLocalStyles as ls, subStyles } from './TaskItemView.styles';
import { TaskActionRow } from './TaskActionRow';

interface Props {
  item: TaskItem;
  accentColor: string;
  removeTask: (id: string) => void;
  editTask: (id: string, title: string) => void;
  onPlay?:    (id: string) => void;
  onRetry?:   (id: string) => void;
  onAllowMe?: (id: string) => void;
}

const SubActionIcon = ({ action }: { action: string }) => (<Text style={subStyles.actionIcon}>{{click:'🖱',type:'⌨',wait:'⏳',navigate:'🧭',scan_dom:'🔍',verify:'✅',interact:'👆',done:'🏁'}[action]||'▸'}</Text>);

export const TaskItemView = React.memo(({ item, accentColor, removeTask, editTask, onPlay, onRetry, onAllowMe }: Props) => {
  const [isEditing, setIsEditing] = useState(false); const [editValue, setEditValue] = useState(item.title); const [expanded, setExpanded] = useState(false);
  const cardRef = useRef<any>(null);
  const prevStatus = useRef(item.status);
  const mountedRef = useRef(false);
  useEffect(() => { mountedRef.current = true; }, []);
  useEffect(() => {
    if (prevStatus.current !== 'completed' && item.status === 'completed') {
      cardRef.current?.flash?.(600);
    }
    prevStatus.current = item.status;
  }, [item.status]);
  const isDone = item.status === 'completed';
  const isFailed = item.status === 'failed';
  const getStatusColor = (s: TaskStatus) => s === 'completed' ? '#00ffaa' : s === 'failed' ? '#ff4444' : s === 'in_progress' ? accentColor : '#555';
  const save = () => { editTask(item.id, editValue); setIsEditing(false); };
  const statusBadge = getStatusBadge(item.status);
  const elapsedTime = getElapsedTime(item.startTime);
  const showProgress = (item.status === 'in_progress' || item.status === 'completed' || item.isMission) && item.progress !== undefined;
  const hasSubActions = item.subActions && item.subActions.length > 0;
  return (
    <Animatable.View
      ref={cardRef}
      animation={mountedRef.current ? undefined : 'fadeInRight'} duration={400}
      style={[
        styles.taskCard,
        isDone && ls.completedCardOverlay,
        isDone && { borderColor: 'rgba(0,255,170,0.25)', opacity: 0.82 },
        item.status === 'in_progress' && { borderColor: accentColor, shadowColor: accentColor, shadowOpacity: 0.3, shadowRadius: 15 },
        item.isMission && subStyles.missionCard,
        item.isMission && { borderColor: accentColor + '88' },
      ]}
    >
      <View style={[styles.statusVertical, { backgroundColor: getStatusColor(item.status) }]} />
      <View style={styles.cardInfo}>
        {isEditing ? (
          <TextInput autoFocus style={styles.editInput} value={editValue} onChangeText={setEditValue} onBlur={save} onSubmitEditing={save} />
        ) : (
          <TouchableOpacity onLongPress={() => setIsEditing(true)} onPress={hasSubActions ? () => setExpanded(!expanded) : undefined}>
            {item.isMission && <Text style={[subStyles.missionLabel, { color: accentColor }]}>📋 MISSION</Text>}
            <Text style={[
              styles.taskTitle,
              isDone && ls.completedTitle,
              isFailed && { color: 'rgba(255,68,68,0.5)' },
            ]}>{item.title.toUpperCase()}</Text>
            <View style={ls.metaRow}>
              <Text style={[ls.badge, { color: statusBadge.color }]}>{statusBadge.text}</Text>
              {elapsedTime && <Text style={[ls.timeText, { color: accentColor }]}>⏱ {elapsedTime}</Text>}
              {hasSubActions && <Text style={[subStyles.expandHint, { color: accentColor }]}>{expanded ? '▼' : '▶'} {item.subActions!.length} action{item.subActions!.length !== 1 ? 's' : ''}</Text>}
            </View>
            {item.details && <Text style={styles.taskDetails} numberOfLines={2}>{item.details}</Text>}
          </TouchableOpacity>
        )}
        {showProgress && (
          <View style={ls.progressContainer}>
            <TaskProgressBar
              progress={item.progress}
              accentColor={isDone ? '#00ffaa' : accentColor}
              showPercentage
              height={item.isMission ? 4 : 2}
            />
          </View>
        )}
        {expanded && hasSubActions && (
          <View style={subStyles.subActionsContainer}>
            {item.subActions!.map((sa: SubAction, idx: number) => {
              const saDone = sa.status === 'completed';
              return (
                <View key={idx} style={[subStyles.subActionRow, saDone && subStyles.subActionDoneRow]}>
                  <SubActionIcon action={sa.action} />
                  <Text style={[subStyles.subActionText, saDone && subStyles.subActionDone]} numberOfLines={1}>
                    {sa.explanation}
                  </Text>
                  {saDone && <Text style={{ fontSize: 8, color: '#00ffaa', marginLeft: 4 }}>✓</Text>}
                </View>
              );
            })}
          </View>
        )}
        <TaskActionRow taskId={item.id} status={item.status} onPlay={onPlay} onRetry={onRetry} onAllowMe={onAllowMe} />
      </View>
      <TouchableOpacity onPress={() => removeTask(item.id)} style={styles.cardAction}><Text style={[styles.closeIcon, { color: 'rgba(255,255,255,0.2)' }]}>×</Text></TouchableOpacity>
    </Animatable.View>
  );
});
