// Feature: Hooks | Trace: README.md
/*
 * [Parent Feature/Milestone] Hooks
 * [Child Task/Issue] Generic service syncing hook
 * [Subtask] Sync service state changes to component state with automatic subscription management
 * [Upstream] Manual service listener management -> [Downstream] Declarative useService<T> hook
 * [Law Check] 85 lines | Passed 100-Line Law
 */

import { useState, useEffect, useRef } from 'react';
import { logger } from '../shared/logger.service';

export interface UseServiceOptions<T> {
  onUpdate?: (data: T) => void;
  onError?: (error: Error) => void;
  context?: string;
}

/**Generic hook for syncing external service state to component state */
export const useService = <T,>(
  initialValue: T,
  subscribe: (callback: (data: T) => void) => () => void,
  options: UseServiceOptions<T> = {}
): T => {
  const { onUpdate, onError, context = 'useService' } = options;
  const [state, setState] = useState<T>(initialValue);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    logger.debug(context, 'Subscribing to service');

    try {
      unsubscribeRef.current = subscribe((data: T) => {
        setState(data);
        onUpdate?.(data);
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      onError?.(error);
      logger.error(context, 'Service subscription failed', error);
    }

    return () => {
      logger.debug(context, 'Unsubscribing from service');
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [subscribe, onUpdate, onError, context]);

  return state;
};

/**Generic hook for service data with loading/error/retry states */
export const useServiceData = <T,>(
  fetchFn: () => Promise<T>,
  subscribe: (callback: (data: T) => void) => () => void,
  options: UseServiceOptions<T> & { initialData?: T } = {}
): { data: T | undefined; isLoading: boolean; error: Error | null; retry: () => void } => {
  const { initialData, onUpdate, onError, context = 'useServiceData' } = options;
  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const load = async () => {
    try {
      setIsLoading(true);
      const result = await fetchFn();
      setData(result);
      onUpdate?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    unsubscribeRef.current = subscribe((data: T) => {
      setData(data);
      onUpdate?.(data);
    });

    return () => {
      unsubscribeRef.current?.();
    };
  }, [subscribe, fetchFn, onUpdate, onError, context]);

  return { data, isLoading, error, retry: load };
};
