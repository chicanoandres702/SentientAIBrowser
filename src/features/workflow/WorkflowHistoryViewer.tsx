// Feature: Workflow History Viewer | Trace: src/features/workflow/WorkflowHistoryViewer.tsx
/*
AIDDE TRACE HEADER
File: WorkflowHistoryViewer.tsx
Feature: Workflow history viewer component
Why: Display past workflow events and results
*/
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const WorkflowHistoryViewer: React.FC<{ userId: string }> = ({ userId }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get(`/api/workflow/history?userId=${userId}`).then(res => setHistory(res.data.history));
  }, [userId]);

  return (
    <div style={{ padding: 16 }}>
      <h3>Workflow History</h3>
      <div style={{ marginBottom: 12 }}>
        <label>
          Filter by type:
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="">All</option>
            {[...new Set(history.map(h => h.type))].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label style={{ marginLeft: 16 }}>
          Search:
          <input value={search} onChange={e => setSearch(e.target.value)} style={{ marginLeft: 8 }} />
        </label>
        <button style={{ marginLeft: 16 }} onClick={() => {
          const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `workflow-history-${userId}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }}>Export JSON</button>
      </div>
      <ul>
        {history
          .filter(event => !filter || event.type === filter)
          .filter(event => !search || JSON.stringify(event).toLowerCase().includes(search.toLowerCase()))
          .map((event, i) => (
            <li key={i}>
              <strong>{event.type}</strong> @ {new Date(event.timestamp).toLocaleString()}<br />
              <pre>{JSON.stringify(event.details, null, 2)}</pre>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default WorkflowHistoryViewer;
