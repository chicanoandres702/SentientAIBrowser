// Feature: Components | Trace: README.md
/*
 * [Parent Feature/Milestone] Components
 * [Child Task/Issue] Higher-order component wrappers
 * [Subtask] withAuth, withErrorBoundary, withLoading HOCs for common patterns
 * [Upstream] Repeated pattern implementations -> [Downstream] Reusable HOC library
 * [Law Check] 92 lines | Passed 100-Line Law
 */

import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { logger } from '../../shared/logger.service';

export interface WithAuthProps {
  isAuthenticated: boolean;
  fallback?: React.ReactNode;
}

/**HOC to require authentication before rendering component */
export const withAuth = <P extends object>(Component: React.ComponentType<P>, context: string = 'withAuth') => {
  return (props: P & WithAuthProps) => {
    const { isAuthenticated, fallback, ...componentProps } = props;
    if (!isAuthenticated) {
      logger.warn(context, 'Unauthorized access attempt');
      return <View>{fallback || <Text>Please log in</Text>}</View>;
    }
    return <Component {...(componentProps as P)} />;
  };
};

export interface WithErrorBoundaryProps {
  onError?: (error: Error) => void;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**HOC to catch component errors with fallback UI */
export const withErrorBoundary = <P extends object>(Component: React.ComponentType<P>, context: string = 'withErrorBoundary') => {
  return class ErrorBoundary extends React.Component<P & WithErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: P & WithErrorBoundaryProps) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error) {
      logger.error(context, 'Error boundary caught error', error);
      this.props.onError?.(error);
    }

    render() {
      const { hasError, error } = this.state;
      const { onError, fallback, ...componentProps } = this.props;
      if (hasError) {
        return <View>{fallback || <Text>Something went wrong</Text>}</View>;
      }
      return <Component {...(componentProps as P)} />;
    }
  };
};

export interface WithLoadingProps {
  isLoading: boolean;
  fallback?: React.ReactNode;
}

/**HOC to show loading indicator while data loads */
export const withLoading = <P extends object>(Component: React.ComponentType<P>, context: string = 'withLoading') => {
  return (props: P & WithLoadingProps) => {
    const { isLoading, fallback, ...componentProps } = props;
    if (isLoading) {
      return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>{fallback || <ActivityIndicator size='large' />}</View>;
    }
    return <Component {...(componentProps as P)} />;
  };
};

/**Compose multiple HOCs */
export const compose = <P extends object>(...hocs: ((c: React.ComponentType<any>) => React.ComponentType<any>)[]): ((c: React.ComponentType<P>) => React.ComponentType<P>) => {
  return (component: React.ComponentType<P>) => hocs.reduceRight((acc, hoc) => hoc(acc), component);
};
