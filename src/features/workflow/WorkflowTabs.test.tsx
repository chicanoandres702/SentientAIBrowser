/*
AIDDE TRACE HEADER
Test: WorkflowTabs
Why: Validate tab rendering, selection, and WebSocket updates
*/
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import WorkflowTabs from './WorkflowTabs';

describe('WorkflowTabs', () => {
  it('renders tabs and switches active tab', async () => {
    // Mock WebSocket
    const wsUrl = 'ws://localhost:1234';
    (global as any).WebSocket = class {
      onmessage: ((event: { data: string }) => void) | null = null;
      close() {}
      constructor() {
        setTimeout(() => {
          if (this.onmessage) {
            this.onmessage({ data: JSON.stringify({ workflows: [
              { id: '1', name: 'Tab 1', status: 'running' },
              { id: '2', name: 'Tab 2', status: 'done' }
            ] }) });
          }
        }, 10);
      }
    };
    const { getByText } = render(<WorkflowTabs wsUrl={wsUrl} />);
    await waitFor(() => getByText('Tab 1 ⏳'));
    fireEvent.click(getByText('Tab 2 ✅'));
    await waitFor(() => getByText('Active Workflow: 2'));
  });
});
