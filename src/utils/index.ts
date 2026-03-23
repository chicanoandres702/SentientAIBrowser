// Feature: Core | Trace: README.md
/*
 * [Parent Feature/Milestone] Core
 * [Child Task/Issue] Backwards compatibility exports
 * [Subtask] Re-export core utilities from new feature location for gradual migration
 * [Upstream] Old src/utils -> [Downstream] New src/features/core
 * [Law Check] 50 lines | Passed 100-Line Law
 */

export {
  logger,
  TASK_STATUS,
  API_ENDPOINTS,
  FIRESTORE_COLLECTIONS,
  STATUS_MESSAGES,
  ACTION_TYPES,
  UI_THEME,
  ERROR_MESSAGES,
  TIMINGS,
} from '../features/core';

export {
  tryAsync,
  trySync,
  getErrorMessage,
  getErrorStatus,
  createAppError,
  formatError,
} from '../features/core';

export {
  isValidEmail,
  isValidUrl,
  isNonEmptyString,
  isPositiveInt,
  isValidTaskStatus,
  sanitizeInput,
} from '../features/core';

export {
  serviceFactory,
  type ServiceContainer,
} from '../features/core';

export type {
  Task,
  Mission,
  BrowserTab,
  Session,
  User,
  ApiRequest,
  ApiResponse,
  BrowserAction,
} from '../features/core';
