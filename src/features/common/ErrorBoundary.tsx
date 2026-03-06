// Feature: ErrorBoundary | Trace: src/features/common/ErrorBoundary.tsx
/*
AIDDE TRACE HEADER
File: ErrorBoundary.tsx
Feature: Modular error boundary for React features
Why: Robust error handling and user feedback
*/
import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // Log error to analytics or Firestore here
    if (window && window.navigator) {
      // Example: send error to a remote endpoint
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: error.message, info }),
      });
    }
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'red', padding: 16, background: '#fffbe6', border: '1px solid #b28500', borderRadius: 8 }}>
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Something went wrong.</div>
          <div>Error: {this.state.error?.message}</div>
          <button style={{ marginTop: 12, padding: '6px 16px', borderRadius: 4, border: 'none', background: '#007bff', color: '#fff', cursor: 'pointer' }} onClick={this.handleReset}>Try Again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
