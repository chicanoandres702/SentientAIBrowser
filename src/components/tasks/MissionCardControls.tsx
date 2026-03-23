// Feature: Tasks UI | Trace: src/components/tasks/MissionCardControls.tsx
import React from 'react';
import { View } from 'react-native';
import { MissionQueueControls } from './MissionQueueControls';
import type { MissionCardActions } from './MissionCard';

interface Props {
  missionId: string;
  isActive: boolean;
  actions?: MissionCardActions;
  accentColor: string;
}

export const MissionCardControls: React.FC<Props> = ({ missionId, isActive, actions, accentColor }) => {
  if (!actions) return null;
  return (
    <View style={{ marginTop: 12 }}>
      <MissionQueueControls
        missionId={missionId}
        isActive={isActive}
        isPaused={actions.isPaused || false}
        onPlay={actions.onPlay}
        onPause={actions.onPause}
        onStop={actions.onStop}
        onSave={actions.onSave}
        accentColor={accentColor}
      />
    </View>
  );
};
