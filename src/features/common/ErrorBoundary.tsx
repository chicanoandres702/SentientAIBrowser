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
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // Log error to analytics or Firestore here
  }

  render() {
    if (this.state.hasError) {
      return <div style={{ color: 'red', padding: 16 }}>Error: {this.state.error?.message}</div>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
