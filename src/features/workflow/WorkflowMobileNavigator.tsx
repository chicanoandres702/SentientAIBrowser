// Feature: Workflow Mobile Layout | Trace: src/features/workflow/WorkflowMobileLayout.tsx
import React from 'react';
import { WorkflowStepNavigator, WorkflowStep } from './WorkflowStepNavigator';

interface Props {
  steps: WorkflowStep[];
  onStepChange: (stepId: string) => void;
  onStepModify: (stepId: string) => void;
  onReplan: (stepId: string, retry: boolean) => void;
  embedNavigator: boolean;
}

export const WorkflowMobileNavigator: React.FC<Props> = ({ steps, onStepChange, onStepModify, onReplan, embedNavigator }) => (
  embedNavigator ? (
    <div style={{ width: '100%', marginBottom: 8 }}>
      <WorkflowStepNavigator
        steps={steps}
        onStepChange={onStepChange}
        onStepModify={onStepModify}
        onReplan={onReplan}
      />
    </div>
  ) : null
);
