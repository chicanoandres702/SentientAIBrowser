// Feature: Workflow Mobile Layout | Trace: src/features/workflow/WorkflowMobileLayout.tsx
import { useState, useEffect } from 'react';
import { WorkflowStep } from './WorkflowStepNavigator';

export function useWorkflowMobileLogic(workflows: { id: string; label: string; results: string }[]) {
  const steps: WorkflowStep[] = (Array.isArray(workflows) ? workflows : []).map(w => ({
    id: w.id,
    label: w.label,
    status: 'pending',
  }));
  const [activeTab, setActiveTab] = useState(workflows[0]?.id || '');
  const [stepStatus, setStepStatus] = useState<Record<string, WorkflowStep['status']>>({});
  const [modal, setModal] = useState<null | { question: string; options: string[]; showInput?: boolean; inputLabel?: string; onSelect: (opt: string, val?: string) => void }>(null);

  // Handlers for step navigation and modal
  const handleStepChange = (stepId: string) => setActiveTab(stepId);
  const handleStepModify = (stepId: string) => {
    setModal({
      question: 'Modify Step',
      options: ['Mark Active', 'Mark Completed', 'Cancel'],
      onSelect: (opt) => {
        if (opt === 'Mark Active') setStepStatus(prev => ({ ...prev, [stepId]: 'active' }));
        if (opt === 'Mark Completed') setStepStatus(prev => ({ ...prev, [stepId]: 'completed' }));
        setModal(null);
      },
    });
  };
  const handleReplan = (stepId: string, retry: boolean) => {
    setModal({
      question: 'Replan Step',
      options: ['Retry Step', 'Replan Step', 'Cancel'],
      showInput: true,
      inputLabel: 'Describe new plan (optional):',
      onSelect: (opt, val) => {
        if (opt === 'Retry Step') setStepStatus(prev => ({ ...prev, [stepId]: 'pending' }));
        if (opt === 'Replan Step') setStepStatus(prev => ({ ...prev, [stepId]: 'failed' }));
        setActiveTab(stepId);
        setModal(null);
      },
    });
  };
  const stepsWithStatus = steps.map(s => ({ ...s, status: stepStatus[s.id] || s.status }));

  // Wire backend modal triggers to frontend event handling in WorkflowMobileLayout
  // Listen for WebSocket events and trigger modal when AI confidence is low
  const wsUrl = 'wss://ghcr.io/<your-org-or-user>/<repo>/playwright-proxy:latest'; // GHCR proxy container endpoint
  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.result) {
          const confidence = data.result.includes('ambiguous') ? 0.4 : 0.9;
          if (confidence < 0.5) {
            setModal({
              question: 'AI is unsure how to proceed. What should happen next?',
              options: ['Retry', 'Skip', 'Request Clarification'],
              onSelect: (opt) => {
                if (opt === 'Retry' && data.workflowId) setStepStatus(prev => ({ ...prev, [data.workflowId]: 'pending' }));
                if (opt === 'Skip' && data.workflowId) setStepStatus(prev => ({ ...prev, [data.workflowId]: 'completed' }));
                if (opt === 'Request Clarification') {
                  setModal({
                    question: 'Please clarify your intent:',
                    options: ['Submit', 'Cancel'],
                    showInput: true,
                    inputLabel: 'Clarification:',
                    onSelect: (_submitOpt, _val) => {
                      setModal(null);
                    },
                  });
                  return;
                }
                setModal(null);
              },
            });
          }
        }
      } catch (e) {
        console.error('WS message processing failed:', e);
      }
    };
    return () => ws.close();
  }, []);

  return {
    stepsWithStatus,
    activeTab,
    modal,
    setModal,
    handleStepChange,
    handleStepModify,
    handleReplan,
  };
}
