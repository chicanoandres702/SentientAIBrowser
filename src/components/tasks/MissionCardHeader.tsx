// Feature: Tasks UI | Trace: src/components/tasks/MissionCardHeader.tsx
import React from 'react';
import { View, Text, Platform } from 'react-native';
import { missionStyles as ms } from './TaskQueueUI.styles';

interface Props {
  dragProps?: Record<string, any>;
  title: string;
  accentColor: string;
  progress: number;
  isDone: boolean;
  isActive: boolean;
  onMoveUp?: (() => void) | null;
  onMoveDown?: (() => void) | null;
}

export const MissionCardHeader: React.FC<Props> = ({
  dragProps,
  title,
  accentColor,
  progress,
  isDone,
  isActive,
  onMoveUp,
  onMoveDown,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
}) => (
  <View style={ms.cardHeader}>
    {Platform.OS === 'web' && dragProps && (
      <Text style={[ms.dragHandle, { color: 'rgba(255,255,255,0.2)', fontSize: 14 }]}>⠿</Text>
    )}
    <View style={{ flex: 1 }}>
      <Text style={[ms.title, { color: isActive ? accentColor : '#ccc' }]} numberOfLines={1}>
        {title}
      </Text>
    </View>
    <Text style={[ms.pct, { color: isDone ? '#00ff78' : accentColor }]}>
      {progress}%
    </Text>
  </View>
);
