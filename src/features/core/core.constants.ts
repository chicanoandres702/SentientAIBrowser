// Feature: Core | Trace: README.md
/*
 * [Parent Feature/Milestone] Core
 * [Child Task/Issue] Constants consolidation
 * [Subtask] Centralized magic strings, API endpoints, status values
 * [Upstream] Scattered constants -> [Downstream] Single source of truth
 * [Law Check] 67 lines | Passed 100-Line Law
 */

export const TASK_STATUS = { pending: 'pending', in_progress: 'in_progress', completed: 'completed', failed: 'failed' } as const;

export const API_ENDPOINTS = {
  AGENT_ANALYZE: '/agent/analyze',
  AGENT_PLAN: '/agent/plan',
  PROXY_ACTION: '/proxy/action',
  SCREENSHOT: '/screenshot',
  PROXY_DOM_MAP: '/proxy/dom-map',
  PROXY_EXECUTE: '/proxy/execute',
} as const;

export const FIRESTORE_COLLECTIONS = {
  MISSIONS: 'missions',
  BROWSER_TABS: 'browser_tabs',
  TASK_QUEUE: 'task_queue',
  ROUTINES: 'routines',
  KNOWLEDGE_HIERARCHY: 'knowledge_hierarchy',
} as const;

export const STATUS_MESSAGES = {
  THINKING: 'Thinking (Cloud)...',
  NAVIGATING: 'Navigating...',
  AWAITING_INPUT: 'Awaiting Input',
  PROCESSING: 'Processing...',
  IDLE: 'Ready',
} as const;

export const ACTION_TYPES = { click: 'click', type: 'type', navigate: 'navigate', scan_dom: 'scan_dom', done: 'done' } as const;

export const UI_THEME = { primaryColor: '#2196F3', accentColor: '#FF9800', backgroundColor: '#FFFFFF', textColor: '#212121' } as const;

export const ERROR_MESSAGES = {
  SESSION_EXPIRED: 'Session expired. Please log in again.',
  INVALID_URL: 'Please enter a valid URL.',
  NETWORK_ERROR: 'Network error. Please try again.',
} as const;

export const TIMINGS = {
  DEBOUNCE_SCREENSHOT: 500,
  TASK_CHECK_INTERVAL: 1000,
  SESSION_REFRESH: 300000,
  ROUTE_TIMEOUT: 30000,
} as const;
