/*
AIDDE TRACE HEADER
File: WorkflowStepNavigator.tsx
Feature: Workflow step navigation and replanning UI
Why: Enable clear navigation, modification, and replanning of workflow steps
*/
import React, { useState } from 'react';

export interface WorkflowStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
}

interface WorkflowStepNavigatorProps {
  steps: WorkflowStep[];
  onStepChange: (stepId: string) => void;
  onStepModify: (stepId: string) => void;
  onReplan: (stepId: string, retry: boolean) => void;
}

export const WorkflowStepNavigator: React.FC<WorkflowStepNavigatorProps> = ({
  steps,
  onStepChange,
  onStepModify,
  onReplan,
}) => {
  const [currentStepId, setCurrentStepId] = useState(steps[0]?.id || '');
  const [showReplan, setShowReplan] = useState(false);
  const currentStep = steps.find(s => s.id === currentStepId);

  return (
    <div style={{ padding: 24, background: '#f9f9f9', borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', maxWidth: 480 }}>
      <h3>Workflow Steps</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {steps.map(step => (
          <button
            key={step.id}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: step.id === currentStepId ? '2px solid #007bff' : '1px solid #ccc',
              background: step.status === 'completed' ? '#ddffdd' : step.status === 'failed' ? '#ffdddd' : '#fff',
              color: '#222',
              fontWeight: step.id === currentStepId ? 'bold' : 'normal',
              cursor: 'pointer',
            }}
            onClick={() => {
              setCurrentStepId(step.id);
              onStepChange(step.id);
            }}
          >
            {step.label}
          </button>
        ))}
      </div>
      {currentStep && (
        <div style={{ marginBottom: 16 }}>
          <strong>Current Step:</strong> {currentStep.label}
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button
              style={{ padding: '6px 14px', borderRadius: 5, background: '#eee', border: 'none', cursor: 'pointer' }}
              onClick={() => onStepModify(currentStep.id)}
            >
              Modify Step
            </button>
            <button
              style={{ padding: '6px 14px', borderRadius: 5, background: '#eee', border: 'none', cursor: 'pointer' }}
              onClick={() => setShowReplan(true)}
            >
              Replan/Retry
            </button>
          </div>
        </div>
      )}
      {showReplan && currentStep && (
        <div style={{ background: '#fff', border: '1px solid #ccc', borderRadius: 6, padding: 16, marginTop: 8 }}>
          <h4>Replan Step</h4>
          <p>Would you like to retry this step, or replan it with a new approach?</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              style={{ padding: '6px 14px', borderRadius: 5, background: '#007bff', color: '#fff', border: 'none', cursor: 'pointer' }}
              onClick={() => {
                onReplan(currentStep.id, true);
                setShowReplan(false);
              }}
            >
              Retry Step
            </button>
            <button
              style={{ padding: '6px 14px', borderRadius: 5, background: '#28a745', color: '#fff', border: 'none', cursor: 'pointer' }}
              onClick={() => {
                onReplan(currentStep.id, false);
                setShowReplan(false);
              }}
            >
              Replan Step
            </button>
            <button
              style={{ padding: '6px 14px', borderRadius: 5, background: '#eee', border: 'none', cursor: 'pointer' }}
              onClick={() => setShowReplan(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
