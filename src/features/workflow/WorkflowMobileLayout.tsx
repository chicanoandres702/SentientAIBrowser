/*
AIDDE TRACE HEADER
File: WorkflowMobileLayout.tsx
Feature: Mobile-optimized workflow layout with embedded controls and info
Why: Ensure all controls and info are visible and usable on mobile, with option to embed step navigator and modals
*/
import React, { useState, useEffect } from 'react';
import { WorkflowTabs } from './WorkflowTabs';
import { WorkflowStepNavigator, WorkflowStep } from './WorkflowStepNavigator';
import { ModalPrompt } from '../common/ModalPrompt';

interface WorkflowMobileLayoutProps {
  workflows: { id: string; label: string; results: string }[];
  embedNavigator?: boolean;
}

export const WorkflowMobileLayout: React.FC<WorkflowMobileLayoutProps> = ({ workflows, embedNavigator = true }) => {
  const steps: WorkflowStep[] = workflows.map(w => ({
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
  const wsUrl = 'ws://localhost:8080'; // Replace with your WebSocket server URL
  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Example: data.result contains AI confidence context
      if (data && data.result) {
        // Simulate AI confidence check
        const confidence = data.result.includes('ambiguous') ? 0.4 : 0.9;
        if (confidence < 0.5) {
          setModal({
            question: 'AI is unsure how to proceed. What should happen next?',
            options: ['Retry', 'Skip', 'Request Clarification'],
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
        }
      }
    };
    return () => ws.close();
  }, []);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f5f5f5',
      padding: 0, margin: 0, fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        width: '100%', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
        padding: '8px 0', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <h2 style={{ textAlign: 'center', fontSize: 20, margin: 0 }}>Workflow</h2>
      </div>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'stretch',
        padding: '8px', gap: '8px',
      }}>
        {embedNavigator && (
          <div style={{ width: '100%', marginBottom: 8 }}>
            <WorkflowStepNavigator
              steps={stepsWithStatus}
              onStepChange={handleStepChange}
              onStepModify={handleStepModify}
              onReplan={handleReplan}
            />
          </div>
        )}
        <div style={{ width: '100%', flex: 1, overflowY: 'auto', background: '#fff', borderRadius: 8, boxShadow: '0 1px 6px rgba(0,0,0,0.04)', padding: 8 }}>
          <WorkflowTabs workflows={workflows} />
        </div>
      </div>
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
      <div style={{
        width: '100%', background: '#fff', boxShadow: '0 -2px 8px rgba(0,0,0,0.07)',
        padding: '8px 0', position: 'sticky', bottom: 0, zIndex: 10,
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      }}>
        <button style={{ padding: '8px 16px', borderRadius: 6, background: '#007bff', color: '#fff', border: 'none', fontWeight: 500 }}>Run</button>
        <button style={{ padding: '8px 16px', borderRadius: 6, background: '#28a745', color: '#fff', border: 'none', fontWeight: 500 }}>Pause</button>
        <button style={{ padding: '8px 16px', borderRadius: 6, background: '#dc3545', color: '#fff', border: 'none', fontWeight: 500 }}>Stop</button>
      </div>
    </div>
  );
};
