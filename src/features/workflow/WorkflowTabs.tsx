// Usage example:
// import ErrorBoundary from '../common/ErrorBoundary';
// <ErrorBoundary><WorkflowTabs wsUrl={...} /></ErrorBoundary>
// Feature: Workflow Tabs | Trace: src/features/workflow/WorkflowTabs.tsx
import React, { useState, useEffect } from 'react';

interface WorkflowTab {
  id: string;
  label: string;
  results: string;
}

const wsUrl = 'ws://localhost:8080'; // Replace with your WebSocket server URL

export const WorkflowTabs: React.FC<{ workflows: WorkflowTab[] }> = ({ workflows }) => {
  const [activeTab, setActiveTab] = useState(workflows[0]?.id || '');
  const [results, setResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setResults(prev => ({ ...prev, [data.workflowId]: data.result }));
      setLoading(false);
    };
    return () => ws.close();
  }, []);

  return (
    <div>
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
