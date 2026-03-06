"use strict";
/**
 * Sentient File Header
 * Why: Unified trace/error logger for Sentient AI Browser backend
 * Filepath: functions/src/core/sentientLogger.ts
 * Description: Provides trace and error logging for backend modules
 * Trace: Used by orchestrator, backend, and CI/CD gates
 * Wiring: Exported sentientLogger object
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sentientLogger = void 0;
exports.sentientLogger = {
    trace: (...args) => {
        if (process.env.NODE_ENV !== 'production') {
            // Use console.debug for trace logs
            console.debug('[TRACE][sentientLogger]', ...args);
        }
    },
    error: (...args) => {
        // Always log errors
        console.error('[ERROR][sentientLogger]', ...args);
    }
};
//# sourceMappingURL=sentientLogger.js.map