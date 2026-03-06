// Feature: Tasks | Trace: src/components/WorkflowPanel.tsx
import React from 'react';
import { SaveRoutineModal } from './tasks/SaveRoutineModal';
import type { TaskItem } from '../features/tasks';

interface Props {
  saveModal: { goal: string; tasks: TaskItem[] } | null;
  setSaveModal: (modal: { goal: string; tasks: TaskItem[] } | null) => void;
  proxyBaseUrl: string;
  accent: string;
}

export const WorkflowSaveRoutineModal: React.FC<Props> = ({
  saveModal,
  setSaveModal,
  proxyBaseUrl,
  accent,
}) => (
  saveModal ? (
    <SaveRoutineModal
      visible
      goal={saveModal.goal}
      tasks={saveModal.tasks}
      proxyBaseUrl={proxyBaseUrl}
      accentColor={accent}
      onClose={() => setSaveModal(null)}
    />
  ) : null
);
