// Feature: Workflow Tabs | Trace: src/features/workflow/WorkflowTabGroup.tsx
import React from 'react';

interface WorkflowTab {
  id: string;
  label: string;
  results: string;
}

interface Props {
  groupedWorkflows: Record<string, WorkflowTab[]>;
  activeTab: string;
  setActiveTab: (id: string) => void;
  loading: boolean;
  wsConnected: boolean;
}

export const WorkflowTabGroup: React.FC<Props> = ({ groupedWorkflows = {}, activeTab, setActiveTab, loading, wsConnected }) => (
  <>
    {Object.entries(groupedWorkflows && typeof groupedWorkflows === 'object' ? groupedWorkflows : {}).map(([group, tabs = []]) => (
      <div key={group} style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>{group}</div>
        <div style={{ display: 'flex', borderBottom: '1px solid #ccc' }}>
          {(Array.isArray(tabs) ? tabs : []).map(tab => (
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
              {loading && activeTab === tab.id ? ' ⏳' : ''}
              {!loading && wsConnected && activeTab === tab.id ? ' 🟢' : ''}
            </button>
          ))}
        </div>
      </div>
    ))}
  </>
);
