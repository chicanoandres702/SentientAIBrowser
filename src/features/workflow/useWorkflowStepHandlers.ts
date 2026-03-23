// Feature: Workflow Tabs | Trace: src/features/workflow/useWorkflowStepHandlers.ts
import { useState } from 'react';

export function useWorkflowStepHandlers(aiStepConfidenceDecision: any, setStepStatus: any, setModal: any) {
  const handleStepChange = (stepId: string, setActiveTab: any) => {
    setActiveTab(stepId);
  };
  const handleStepModify = (stepId: string) => {
    const context = 'uncertain';
    const aiDecision = aiStepConfidenceDecision('modify', context);
    if (aiDecision.confidence < 0.5) {
      setModal({
        question: aiDecision.question,
        options: aiDecision.options,
        onSelect: (opt: string) => {
          if (opt === 'Retry') setStepStatus((prev: any) => ({ ...prev, [stepId]: 'pending' }));
          if (opt === 'Skip') setStepStatus((prev: any) => ({ ...prev, [stepId]: 'completed' }));
          if (opt === 'Request Clarification') {
            setModal({
              question: 'Please clarify your intent:',
              options: ['Submit', 'Cancel'],
              showInput: true,
              inputLabel: 'Clarification:',
              onSelect: (submitOpt: string, val: string) => {
                setModal(null);
              },
            });
            return;
          }
          setModal(null);
        },
      });
      return;
    }
    setModal({
      question: 'Modify Step',
      options: ['Mark Active', 'Mark Completed', 'Cancel'],
      onSelect: (opt: string) => {
        if (opt === 'Mark Active') setStepStatus((prev: any) => ({ ...prev, [stepId]: 'active' }));
        if (opt === 'Mark Completed') setStepStatus((prev: any) => ({ ...prev, [stepId]: 'completed' }));
        setModal(null);
      },
    });
  };
  const handleReplan = (stepId: string, setActiveTab: any) => {
    const context = 'uncertain';
    const aiDecision = aiStepConfidenceDecision('replan', context);
    if (aiDecision.confidence < 0.5) {
      setModal({
        question: aiDecision.question,
        options: aiDecision.options,
        showInput: true,
        inputLabel: 'Describe new plan (optional):',
        onSelect: (opt: string, val: string) => {
          if (opt === 'Retry') setStepStatus((prev: any) => ({ ...prev, [stepId]: 'pending' }));
          if (opt === 'Replan') setStepStatus((prev: any) => ({ ...prev, [stepId]: 'failed' }));
          if (opt === 'Request Clarification') {
            setModal({
              question: 'Please clarify your intent:',
              options: ['Submit', 'Cancel'],
              showInput: true,
              inputLabel: 'Clarification:',
              onSelect: (submitOpt: string, val: string) => {
                setModal(null);
              },
            });
            return;
          }
          setActiveTab(stepId);
          setModal(null);
        },
      });
      return;
    }
    setModal({
      question: 'Replan Step',
      options: ['Retry Step', 'Replan Step', 'Cancel'],
      showInput: true,
      inputLabel: 'Describe new plan (optional):',
      onSelect: (opt: string, val: string) => {
        if (opt === 'Retry Step') setStepStatus((prev: any) => ({ ...prev, [stepId]: 'pending' }));
        if (opt === 'Replan Step') setStepStatus((prev: any) => ({ ...prev, [stepId]: 'failed' }));
        setActiveTab(stepId);
        setModal(null);
      },
    });
  };
  return { handleStepChange, handleStepModify, handleReplan };
}
