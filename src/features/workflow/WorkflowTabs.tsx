// Usage example:
// import ErrorBoundary from '../common/ErrorBoundary';
// <ErrorBoundary><WorkflowTabs wsUrl={...} /></ErrorBoundary>
// Feature: Workflow Tabs | Trace: src/features/workflow/WorkflowTabs.tsx
import React, { useState, useEffect } from 'react';
import { ModalPrompt } from '../common/ModalPrompt';
import { WorkflowStepNavigator, WorkflowStep } from './WorkflowStepNavigator';
import { notificationService } from '../common/notification.service';

interface WorkflowTab {
  id: string;
  label: string;
  results: string;
}

const wsUrl = 'ws://localhost:8080'; // Replace with your WebSocket server URL

export const WorkflowTabs: React.FC<{ workflows: WorkflowTab[] }> = ({ workflows }) => {
        // Helper for AI confidence-based modal for step actions
        function aiStepConfidenceDecision(action: string, context: string): { confidence: number; options: string[]; question: string } {
          if (context.includes('ambiguous') || action === 'modify' && context === 'uncertain') {
            return {
              confidence: 0.3,
              options: ['Retry', 'Skip', 'Request Clarification'],
              question: 'AI is unsure how to modify this step. What should happen next?',
            };
          }
          if (action === 'replan' && context === 'uncertain') {
            return {
              confidence: 0.4,
              options: ['Retry', 'Replan', 'Request Clarification'],
              question: 'AI is unsure how to replan. What should happen next?',
            };
          }
          return {
            confidence: 0.9,
            options: ['Continue'],
            question: 'AI is confident. Continue?',
          };
        }
      // Simulated AI decision function
      function aiConfidenceDecision(context: string): { confidence: number; options: string[]; question: string } {
        // Example: if context contains 'ambiguous', confidence is low
        if (context.includes('ambiguous')) {
          return {
            confidence: 0.4,
            options: ['Retry', 'Skip', 'Request Clarification'],
            question: 'AI is unsure how to proceed. What should happen next?',
          };
        }
        // Otherwise, high confidence
        return {
          confidence: 0.9,
          options: ['Continue'],
          question: 'AI is confident. Continue?',
        };
      }
    const [modal, setModal] = useState<{ question: string; options: string[]; showInput?: boolean; inputLabel?: string; onSelect: (opt: string, val?: string) => void } | null>(null);
  // Steps are mapped from workflows for demo; in real use, steps may be more granular
  const steps: WorkflowStep[] = workflows.map(w => ({
    id: w.id,
    label: w.label,
    status: 'pending',
  }));
  const [activeTab, setActiveTab] = useState(workflows[0]?.id || '');
  const [results, setResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [stepStatus, setStepStatus] = useState<Record<string, WorkflowStep['status']>>({});

  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setResults(prev => ({ ...prev, [data.workflowId]: data.result }));
      setLoading(false);
      setStepStatus(prev => ({ ...prev, [data.workflowId]: 'completed' }));

      // AI confidence check: trigger modal if confidence is low
      const aiDecision = aiConfidenceDecision(data.result || '');
      if (aiDecision.confidence < 0.5) {
        notificationService.notify('warning', `AI is unsure for workflow ${data.workflowId}: ${aiDecision.question}`);
        setModal({
          question: aiDecision.question,
          options: aiDecision.options,
          onSelect: (opt) => {
            if (opt === 'Retry') setStepStatus(prev => ({ ...prev, [data.workflowId]: 'pending' }));
            if (opt === 'Skip') setStepStatus(prev => ({ ...prev, [data.workflowId]: 'completed' }));
            if (opt === 'Request Clarification') {
              setModal({
                question: 'Please clarify your intent:',
                options: ['Submit', 'Cancel'],
                showInput: true,
                inputLabel: 'Clarification:',
                onSelect: (submitOpt, val) => {
                  setModal(null);
                },
              });
              return;
            }
            setModal(null);
          },
        });
      } else {
        notificationService.notify('success', `Workflow ${data.workflowId} completed successfully.`);
      }
    };
    return () => ws.close();
  }, []);

  // Step navigation handlers
  const handleStepChange = (stepId: string) => {
    setActiveTab(stepId);
  };
  const handleStepModify = (stepId: string) => {
    // Simulate context for demo; in real use, context would be step details
    const context = 'uncertain';
    const aiDecision = aiStepConfidenceDecision('modify', context);
    if (aiDecision.confidence < 0.5) {
      setModal({
        question: aiDecision.question,
        options: aiDecision.options,
        onSelect: (opt) => {
          if (opt === 'Retry') setStepStatus(prev => ({ ...prev, [stepId]: 'pending' }));
          if (opt === 'Skip') setStepStatus(prev => ({ ...prev, [stepId]: 'completed' }));
          if (opt === 'Request Clarification') {
            setModal({
              question: 'Please clarify your intent:',
              options: ['Submit', 'Cancel'],
              showInput: true,
              inputLabel: 'Clarification:',
              onSelect: (submitOpt, val) => {
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
      onSelect: (opt) => {
        if (opt === 'Mark Active') setStepStatus(prev => ({ ...prev, [stepId]: 'active' }));
        if (opt === 'Mark Completed') setStepStatus(prev => ({ ...prev, [stepId]: 'completed' }));
        setModal(null);
      },
    });
  };
  const handleReplan = (stepId: string, retry: boolean) => {
    // Simulate context for demo; in real use, context would be step details
    const context = 'uncertain';
    const aiDecision = aiStepConfidenceDecision('replan', context);
    if (aiDecision.confidence < 0.5) {
      setModal({
        question: aiDecision.question,
        options: aiDecision.options,
        showInput: true,
        inputLabel: 'Describe new plan (optional):',
        onSelect: (opt, val) => {
          if (opt === 'Retry') setStepStatus(prev => ({ ...prev, [stepId]: 'pending' }));
          if (opt === 'Replan') setStepStatus(prev => ({ ...prev, [stepId]: 'failed' }));
          if (opt === 'Request Clarification') {
            setModal({
              question: 'Please clarify your intent:',
              options: ['Submit', 'Cancel'],
              showInput: true,
              inputLabel: 'Clarification:',
              onSelect: (submitOpt, val) => {
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
      onSelect: (opt, val) => {
        if (opt === 'Retry Step') setStepStatus(prev => ({ ...prev, [stepId]: 'pending' }));
        if (opt === 'Replan Step') setStepStatus(prev => ({ ...prev, [stepId]: 'failed' }));
        setActiveTab(stepId);
        setModal(null);
      },
    });
  };
  // Merge step status into steps
  const stepsWithStatus = steps.map(s => ({ ...s, status: stepStatus[s.id] || s.status }));

  return (
    <div>
      <WorkflowStepNavigator
        steps={stepsWithStatus}
        onStepChange={handleStepChange}
        onStepModify={handleStepModify}
        onReplan={handleReplan}
      />
      {modal && (
        <ModalPrompt
          question={modal.question}
          options={modal.options}
          showInput={modal.showInput}
          inputLabel={modal.inputLabel}
          onSelect={modal.onSelect}
          onClose={() => setModal(null)}
        />
      )}
      <div style={{ display: 'flex', borderBottom: '1px solid #ccc' }}>
        {workflows.map(tab => (
          <button
            key={tab.id}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #007bff' : 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {loading && (
        <div style={{ textAlign: 'center', padding: 16 }}>
          <span role="status" aria-live="polite">Loading workflows...</span>
          <span style={{ marginLeft: 8, fontSize: 24 }}>⏳</span>
        </div>
      )}
      <div style={{ padding: '16px' }}>
        <pre>{results[activeTab] || workflows.find(w => w.id === activeTab)?.results || 'No results yet.'}</pre>
      </div>
    </div>
  );
};
