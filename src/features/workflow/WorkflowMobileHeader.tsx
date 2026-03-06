// Feature: Workflow Mobile Layout | Trace: src/features/workflow/WorkflowMobileLayout.tsx
import React from 'react';

export const WorkflowMobileHeader: React.FC = () => (
  <div style={{
    width: '100%', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    padding: '8px 0', position: 'sticky', top: 0, zIndex: 10,
  }}>
    <h2 style={{ textAlign: 'center', fontSize: 20, margin: 0 }}>Workflow</h2>
  </div>
);
