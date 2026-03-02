// Feature: Core | Trace: README.md
/*
 * [Parent Feature/Milestone] Core
 * [Child Task/Issue] Backwards compatibility exports
 * [Subtask] Re-export from new core feature location to support legacy shared/ imports
 * [Upstream] Old shared/ -> [Downstream] New src/features/core
 * [Law Check] 46 lines | Passed 100-Line Law
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
} from '../src/features/core';

export {
  tryAsync,
  trySync,
  getErrorMessage,
  getErrorStatus,
  createAppError,
  formatError,
} from '../src/features/core';

export {
  isValidEmail,
  isValidUrl,
  isNonEmptyString,
  sanitizeInput,
} from '../src/features/core';

export {
  serviceFactory,
  type ServiceContainer,
} from '../src/features/core';

export type {
  Task,
  Mission,
  BrowserTab,
  Session,
  User,
  ApiRequest,
  ApiResponse,
  BrowserAction,
} from '../src/features/core';
