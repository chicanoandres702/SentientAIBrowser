// Feature: Core | Trace: README.md
/*
 * [Parent Feature/Milestone] Core
 * [Child Task/Issue] Error handling consolidation
 * [Subtask] Centralized error formatting, wrapping, and logging
 * [Upstream] Scattered try-catch blocks -> [Downstream] Consistent error handling
 * [Law Check] 68 lines | Passed 100-Line Law
 */

export interface AppError {
  code: string;
  message: string;
  status?: number;
  originalError?: unknown;
}

/**Safely extract error message from unknown error */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'Unknown error occurred';
};

/**Safely extract HTTP status from error */
export const getErrorStatus = (error: unknown): number | undefined => {
  if (typeof error === 'object' && error !== null) {
    const err = error as { status?: unknown; statusCode?: unknown };
    if (typeof err.status === 'number') return err.status;
    if (typeof err.statusCode === 'number') return err.statusCode;
  }
  return undefined;
};

/**Create standardized app error */
export const createAppError = (code: string, message: string, status?: number, originalError?: unknown): AppError => ({
  code,
  message,
  status,
  originalError,
});

/**Format error for logging */
export const formatError = (error: unknown, context?: string): string => {
  const msg = getErrorMessage(error);
  const ctx = context ? ` [${context}]` : '';
  return `${msg}${ctx}`;
};

/**Safely handle async operation with error wrapping */
export const tryAsync = async <T>(
  fn: () => Promise<T>,
  errorCode: string = 'ASYNC_ERROR'
): Promise<{ ok: true; data: T } | { ok: false; error: AppError }> => {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: createAppError(errorCode, getErrorMessage(err), getErrorStatus(err), err) };
  }
};

/**Safely handle synchronous operation with error wrapping */
export const trySync = <T>(
  fn: () => T,
  errorCode: string = 'SYNC_ERROR'
): { ok: true; data: T } | { ok: false; error: AppError } => {
  try {
    return { ok: true, data: fn() };
  } catch (err) {
    return { ok: false, error: createAppError(errorCode, getErrorMessage(err), undefined, err) };
  }
};

/**Log error with consistent format */
export const logError = (error: unknown, context: string, level: 'warn' | 'error' = 'error'): void => {
  const formatted = formatError(error, context);
  console[level](`[${context}] ${formatted}`);
};
