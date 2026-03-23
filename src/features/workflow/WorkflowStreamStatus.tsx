// Feature: Workflow Stream Player | Trace: src/features/workflow/WorkflowStreamPlayer.tsx
import React from 'react';
import NotificationBanner from '../common/NotificationBanner';

interface Props {
  status: 'connecting' | 'live' | 'error';
  error: string | null;
}

export const WorkflowStreamStatus: React.FC<Props> = ({ status, error }) => (
  <>
    <NotificationBanner />
    <div aria-live="polite" style={{ marginBottom: 8 }}>
      {status === 'connecting' && <span style={{ color: '#888' }}>Connecting...</span>}
      {status === 'live' && <span style={{ color: 'green' }}>Live</span>}
      {status === 'error' && <span style={{ color: 'red' }}>Error: {error}</span>}
    </div>
  </>
);
