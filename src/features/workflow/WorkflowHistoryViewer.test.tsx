/*
AIDDE TRACE HEADER
Test: WorkflowHistoryViewer
Why: Ensure history events render correctly
*/
import React from 'react';
import { render } from '@testing-library/react';
import WorkflowHistoryViewer from './WorkflowHistoryViewer';

jest.mock('axios', () => ({
  get: () => Promise.resolve({ data: { history: [
    { type: 'start', timestamp: 1234567890, details: { foo: 'bar' } },
    { type: 'end', timestamp: 1234567999, details: { baz: 'qux' } }
  ] } })
}));

describe('WorkflowHistoryViewer', () => {
  it('renders history events', async () => {
    const { findByText } = render(<WorkflowHistoryViewer userId="u1" />);
    expect(await findByText('start')).toBeInTheDocument();
    expect(await findByText('end')).toBeInTheDocument();
    expect(await findByText(/foo/)).toBeInTheDocument();
    expect(await findByText(/baz/)).toBeInTheDocument();
  });
});
