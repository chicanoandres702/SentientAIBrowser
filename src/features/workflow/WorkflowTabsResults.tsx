// Feature: Workflow Tabs | Trace: src/features/workflow/WorkflowTabs.tsx
import React from 'react';

interface Props {
  results: Record<string, string>;
  activeTab: string;
  workflows: { id: string; label: string; results: string }[];
}

export const WorkflowTabsResults: React.FC<Props> = ({ results, activeTab, workflows }) => {
  // Convert results object to array for rendering
  const resultsToRender = results && typeof results === 'object' ? Object.values(results) : [];
  const safeWorkflows = Array.isArray(workflows) ? workflows : [];

  return (
    <div style={{ padding: '16px' }}>
      {resultsToRender.length === 0 ? (
        <pre>No results found.</pre>
      ) : (Array.isArray(resultsToRender) ? resultsToRender : []).map((result, idx) => (
        <pre key={idx}>{result}</pre>
      ))}
    </div>
  );
};
