// Feature: Workflow Tabs | Trace: src/features/workflow/WorkflowTabs.tsx
// Usage example:
// import ErrorBoundary from '../common/ErrorBoundary';
// <ErrorBoundary><WorkflowTabs wsUrl={...} /></ErrorBoundary>
// Feature: Workflow Tabs | Trace: src/features/workflow/WorkflowTabs.tsx
import React, { useState } from 'react';
import { WorkflowStepNavigator, WorkflowStep } from './WorkflowStepNavigator';
import WorkflowStreamPlayer from './WorkflowStreamPlayer';
import { WorkflowTabGroup } from './WorkflowTabGroup';
import { WorkflowTabsModal } from './WorkflowTabsModal';
import { useWorkflowTabsAI } from './useWorkflowTabsAI';
import { useWorkflowTabsModal } from './useWorkflowTabsModal';
import { useWorkflowTabsGrouping } from './useWorkflowTabsGrouping';
import { WorkflowTabsResults } from './WorkflowTabsResults';

interface WorkflowTab {
  id: string;
  label: string;
  results: string;
}

// Use GHCR proxy container endpoint for WebSocket
const wsUrl = 'wss://ghcr.io/<your-org-or-user>/<repo>/playwright-proxy:latest'; // GHCR proxy container endpoint

export const WorkflowTabs: React.FC<{ workflows?: WorkflowTab[] }> = ({ workflows = [] }) => {
  const { aiStepConfidenceDecision, aiConfidenceDecision } = useWorkflowTabsAI();
  const { modal, setModal } = useWorkflowTabsModal();
  const groupedWorkflows = useWorkflowTabsGrouping(workflows);
  const steps: WorkflowStep[] = (Array.isArray(workflows) ? workflows : []).map(w => ({ id: w.id, label: w.label, status: 'pending' }));
  const [activeTab, setActiveTab] = useState(workflows[0]?.id || '');
  const [results, setResults] = useState<Record<string, string>>({});
  const [stepStatus, setStepStatus] = useState<Record<string, WorkflowStep['status']>>({});
  // ...existing code...
  // Extracted step navigation and AI decision logic
  // ...existing code for useWorkflowStepHandlers and useWorkflowTabsSocket...
  // Merge step status into steps
  const stepsWithStatus = steps.map(s => ({ ...s, status: stepStatus[s.id] || s.status }));
  // Wire in FFmpeg video stream player for the active tab
  const sentientProxyWsUrl = `wss://sentient-proxy-184717935920.us-central1.run.app/proxy/ws/${activeTab}`;
  // ...existing code for loading, wsConnected...
  return (
    <div>
      <WorkflowStepNavigator
        steps={stepsWithStatus}
        onStepChange={(stepId: string) => { /* ...existing code... */ setActiveTab(stepId); }}
        onStepModify={() => { /* TODO: implement step modify logic or remove if unused */ }}
        onReplan={(stepId: string) => { /* ...existing code... */ setActiveTab(stepId); }}
      />
      <WorkflowTabsModal modal={modal} setModal={setModal} />
      <WorkflowTabGroup
        groupedWorkflows={groupedWorkflows}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      /* ...existing code for loading, wsConnected... */
      />
      {/* ...existing code for loading spinner... */}
      <WorkflowTabsResults results={results} activeTab={activeTab} workflows={workflows} />
      <WorkflowStreamPlayer wsUrl={sentientProxyWsUrl} type="video" />
    </div>
  );
};

export default WorkflowTabs;
