/*
AIDDE TRACE HEADER
Test: ErrorBoundary
Why: Ensure error boundary catches and displays errors
*/
import React from 'react';
import { render } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <div>Child</div>
      </ErrorBoundary>
    );
    expect(getByText('Child')).toBeInTheDocument();
  });

  it('catches error and displays message', () => {
    const ProblemChild = () => { throw new Error('Boom!'); };
    const { getByText } = render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );
    expect(getByText(/Boom!/)).toBeInTheDocument();
  });
});
