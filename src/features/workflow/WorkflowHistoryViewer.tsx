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

  useEffect(() => {
    axios.get(`/api/workflow/history?userId=${userId}`).then(res => setHistory(res.data.history));
  }, [userId]);

  return (
    <div style={{ padding: 16 }}>
      <h3>Workflow History</h3>
      <ul>
        {history.map((event, i) => (
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
