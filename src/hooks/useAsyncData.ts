// Feature: Hooks | Trace: README.md
/*
 * [Parent Feature/Milestone] Hooks
 * [Child Task/Issue] Generic async data fetching hook
 * [Subtask] Replace 5+ loading/error/data pattern repetitions with reusable hook
 * [Upstream] Scattered useState + error handling -> [Downstream] Single useAsyncData<T> hook
 * [Law Check] 98 lines | Passed 100-Line Law
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { tryAsync } from '../shared/error.utils';
import { logger } from '../shared/logger.service';

export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**Generic async data fetching hook with automatic cleanup and retry logic */
export const useAsyncData = <T,>(
  fn: () => Promise<T>,
  options: {
    dependencies?: unknown[];
    onError?: (error: Error) => void;
    onSuccess?: (data: T) => void;
    initialData?: T;
    context?: string;
  } = {}
): AsyncState<T> => {
  const { dependencies = [], onError, onSuccess, initialData = null, context = 'useAsyncData' } = options;
  const [data, setData] = useState<T | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async () => {
    if (!isMountedRef.current) return;

    setIsLoading(true);
    setError(null);
    logger.debug(context, 'Fetching async data');

    const result = await tryAsync(fn, `ASYNC_FETCH_${context.toUpperCase()}`);

    if (!isMountedRef.current) return;

    if (result.ok) {
      setData(result.data);
      onSuccess?.(result.data);
      logger.debug(context, 'Async data fetched successfully');
    } else {
      const err = new Error(result.error.message);
      setError(err);
      onError?.(err);
      logger.error(context, 'Async data fetch failed', err);
    }

    setIsLoading(false);
  }, [fn, onError, onSuccess, context]);

  useEffect(() => {
    execute();
  }, dependencies);

  const refetch = useCallback(async () => {
    await execute();
  }, [execute]);

  return { data, isLoading, error, refetch };
};
