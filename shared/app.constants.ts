// Feature: Core | Trace: README.md
/*
 * [Parent Feature/Milestone] Core
 * [Child Task/Issue] Constants consolidation
 * [Subtask] Centralized magic strings, API endpoints, status values
 * [Upstream] Scattered hardcoded values -> [Downstream] Single source of truth
 * [Law Check] 67 lines | Passed 100-Line Law
 */

// Task Status Constants
export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type TaskStatusValue = typeof TASK_STATUS[keyof typeof TASK_STATUS];

// API Endpoints
export const API_ENDPOINTS = {
  AGENT_ANALYZE: '/agent/analyze',
  AGENT_PLAN: '/agent/plan',
  PROXY_ACTION: '/proxy/action',
  PROXY_CLICK: '/proxy/click',
  PROXY_SCREENSHOT: '/screenshot',
  PROXY_SCREENSHOT_STREAM: '/screenshot/stream',
  PROXY_DOM_MAP: '/proxy/dom-map',
} as const;

// Firestore Collections
export const FIRESTORE_COLLECTIONS = {
  MISSIONS: 'missions',
  BROWSER_TABS: 'browser_tabs',
  TASKS: 'task_queue',
  ROUTINES: 'routines',
  KNOWLEDGE: 'knowledge_hierarchy',
} as const;

// UI Status Messages
export const STATUS_MESSAGES = {
  THINKING: 'Thinking (Cloud)...',
  NAVIGATING: 'Navigating...',
  SCANNING_DOM: 'Scanning DOM...',
  AWAITING_INPUT: 'Awaiting Input',
  AWAITING_USER: 'Awaiting User',
  EXECUTING: 'Executing...',
  LOST: '⚠️ Lost — blank page',
  ERROR: 'Error: ',
} as const;

// Action Types
export const ACTION_TYPES = {
  CLICK: 'click',
  TYPE: 'type',
  NAVIGATE: 'navigate',
  SCAN_DOM: 'scan_dom',
  DONE: 'done',
  WAIT_FOR_USER: 'wait_for_user',
  ASK_USER: 'ask_user',
  RECORD_KNOWLEDGE: 'record_knowledge',
} as const;

// Theme & UI Constants
export const UI_THEME = {
  ACCENT_SUCCESS: '#00ffaa',
  ACCENT_DANGER: '#ff4444',
  ACCENT_WARNING: '#ffa500',
  BG_DARK: 'rgba(3, 5, 10, 0.82)',
  BORDER_RADIUS: 12,
  SHADOW_ELEVATION: 20,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  SESSION_DIED: 'Session died',
  SESSION_CLOSED: 'Session closed',
  SESSION_UNAVAILABLE: 'Session unavailable',
  NO_PAGE: 'No active session',
  URL_REQUIRED: 'url required',
  CLOUD_ANALYSIS_FAILED: (status: number) => `Cloud Analysis Failed: ${status}`,
} as const;

// Timing Constants (milliseconds)
export const TIMINGS = {
  DEBOUNCE_SCREENSHOT: 800,
  DIRECT_FETCH_BASE_DELAY: 4000,
  DIRECT_FETCH_MAX_DELAY: 20000,
  STALE_SCREENSHOT_THRESHOLD: 45000,
  DEFAULT_TASK_DURATION: 60000,
} as const;
