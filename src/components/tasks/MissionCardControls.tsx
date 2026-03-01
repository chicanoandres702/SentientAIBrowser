// Feature: Tasks UI | Trace: src/components/tasks/MissionCardControls.tsx
import React from 'react';
import { View } from 'react-native';
import { missionStyles as ms } from './TaskQueueUI.styles';
import { MissionQueueControls } from './MissionQueueControls';
import type { MissionCardActions } from './MissionCard';

interface Props {
  actions?: MissionCardActions;
  accentColor: string;
}

export const MissionCardControls: React.FC<Props> = ({ actions, accentColor }) => {
  if (!actions) return null;
  return (
    <View style={ms.cardFooter}>
      <MissionQueueControls
        isPaused={actions.isPaused}
        onPlay={actions.onPlay}
        onPause={actions.onPause}
        onStop={actions.onStop}
        onSave={actions.onSave}
        onMoveUp={actions.onMoveUp}
        onMoveDown={actions.onMoveDown}
        accentColor={accentColor}
      />
    </View>
  );
};
