// Feature: Workflow Mobile Layout | Trace: src/features/workflow/WorkflowMobileLayout.tsx
/*
AIDDE TRACE HEADER
File: WorkflowMobileLayout.tsx
Feature: Mobile-optimized workflow layout with embedded controls and info
Why: Ensure all controls and info are visible and usable on mobile, with option to embed step navigator and modals
*/
import React from 'react';
import { useWorkflowMobileLogic } from './useWorkflowMobileLogic';
import { WorkflowMobileHeader } from './WorkflowMobileHeader';
import { WorkflowMobileNavigator } from './WorkflowMobileNavigator';
import { WorkflowMobileTabs } from './WorkflowMobileTabs';
import { WorkflowMobileModal } from './WorkflowMobileModal';
import { WorkflowMobileFooter } from './WorkflowMobileFooter';

interface WorkflowMobileLayoutProps {
  workflows: { id: string; label: string; results: string }[];
  embedNavigator?: boolean;
}

export const WorkflowMobileLayout: React.FC<WorkflowMobileLayoutProps> = ({ workflows, embedNavigator = true }) => {
  const {
    stepsWithStatus,
    modal,
    setModal,
    handleStepChange,
    handleStepModify,
    handleReplan,
  } = useWorkflowMobileLogic(workflows);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f5f5f5',
      padding: 0, margin: 0, fontFamily: 'system-ui, sans-serif',
    }}>
      <WorkflowMobileHeader />
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'stretch',
        padding: '8px', gap: '8px',
      }}>
        <WorkflowMobileNavigator
          steps={stepsWithStatus}
          onStepChange={handleStepChange}
          onStepModify={handleStepModify}
          onReplan={handleReplan}
          embedNavigator={embedNavigator}
        />
        <WorkflowMobileTabs workflows={workflows} />
      </div>
      <WorkflowMobileModal modal={modal} setModal={setModal} />
      <WorkflowMobileFooter />
    </div>
  );
};
