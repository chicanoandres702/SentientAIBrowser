// Feature: Workflow Mobile Layout | Trace: src/features/workflow/WorkflowMobileLayout.tsx
import React from 'react';
import { WorkflowTabs } from './WorkflowTabs';

interface Props {
  workflows: { id: string; label: string; results: string }[];
}

export const WorkflowMobileTabs: React.FC<Props> = ({ workflows }) => (
  <div style={{ width: '100%', flex: 1, overflowY: 'auto', background: '#fff', borderRadius: 8, boxShadow: '0 1px 6px rgba(0,0,0,0.04)', padding: 8 }}>
    <WorkflowTabs workflows={workflows} />
  </div>
);
