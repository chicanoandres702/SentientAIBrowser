// Feature: Tasks | Trace: workflow-panel.component.tsx
import React from 'react';
import { ActiveMissionCard } from '@features/ui/components';
import type { TaskItem } from '@features/tasks';

interface Props {
  mission: any;
  completedCount: number;
  total: number;
  isActive: boolean;
  isPaused: boolean;
  accent: string;
  barColor: string;
  onCloseMission?: (missionId: string, tabId?: string) => void;
  onPause?: () => void;
  onResume?: () => void;
  setSaveModal: (modal: { goal: string; tasks: TaskItem[] } | null) => void;
  taskList: TaskItem[];
}

export const WorkflowMissionSection: React.FC<Props> = ({
  mission,
  completedCount,
  total,
  isActive,
  isPaused,
  accent,
  barColor,
  onCloseMission,
  onPause,
  onResume,
  setSaveModal,
  taskList,
}) => (
  mission ? (
    <ActiveMissionCard
      mission={mission}
      completedCount={completedCount}
      total={total}
      isActive={isActive}
      isPaused={isPaused}
      accent={accent}
      barColor={barColor}
      onCloseMission={onCloseMission}
      onPause={onPause}
      onResume={onResume}
      onSave={() => setSaveModal({ goal: mission.title, tasks: taskList })}
    />
  ) : null
);
