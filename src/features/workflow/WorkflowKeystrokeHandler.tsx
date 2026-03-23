// Feature: Workflow Keystroke Handler | Trace: src/features/workflow/WorkflowKeystrokeHandler.tsx
import React, { useEffect } from 'react';

export const WorkflowKeystrokeHandler: React.FC<{ ws: WebSocket; activeTab: string }> = ({ ws, activeTab }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      ws.send(JSON.stringify({
        type: 'keystroke',
        key: e.key,
        code: e.code,
        tab: activeTab,
        timestamp: Date.now()
      }));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ws, activeTab]);
  return null;
};
