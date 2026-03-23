/**
 * Sentient File Header
 * Why: Unified trace/error logger for Sentient AI Browser backend
 * Filepath: functions/src/core/sentientLogger.ts
 * Description: Provides trace and error logging for backend modules
 * Trace: Used by orchestrator, backend, and CI/CD gates
 * Wiring: Exported sentientLogger object
 */

export const sentientLogger = {
  trace: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      // Use console.debug for trace logs
      console.debug('[TRACE][sentientLogger]', ...args);
    }
  },
  error: (...args: any[]) => {
    // Always log errors
    console.error('[ERROR][sentientLogger]', ...args);
  }
};
