// Feature: Types | Trace: README.md
/*
 * [Parent Feature/Milestone] Types
 * [Child Task/Issue] Centralized type definitions
 * [Subtask] Domain models, API contracts, Firestore schema types in single source
 * [Upstream] Scattered interfaces across codebase -> [Downstream] types/index.ts
 * [Law Check] 98 lines | Passed 100-Line Law
 */

/**Core domain models */
export interface Task {
  id: string;
  missionId: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  createdAt: number;
  updatedAt: number;
  childTaskIds?: string[];
}

export interface Mission {
  id: string;
  title: string;
  objective: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  taskIds: string[];
  createdAt: number;
  completedAt?: number;
}

export interface BrowserTab {
  id: string;
  url: string;
  title: string;
  sessionId: string;
  lastActivity: number;
  domMap?: Record<string, unknown>;
}

/**API request/response types */
export interface ApiRequest<T = unknown> {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  body?: T;
  timeout?: number;
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

/**Action types from LLM */
export interface BrowserAction {
  type: 'click' | 'type' | 'navigate' | 'scan_dom' | 'done' | 'wait_for_user' | 'ask_user';
  selector?: string;
  text?: string;
  url?: string;
  question?: string;
  reason?: string;
}

/**Session & Auth */
export interface Session {
  userId: string;
  sessionId: string;
  token: string;
  expiresAt: number;
  createdAt: number;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  avatar?: string;
  createdAt: number;
  settings?: Record<string, unknown>;
}

/**Firestore collection types (schema mirrors) */
export interface FirestoreDocument<T = unknown> {
  id: string;
  createdAt: number;
  updatedAt: number;
  data: T;
}

/**Generic async operation result */
export interface Result<T, E = string> {
  ok: boolean;
  data?: T;
  error?: E;
}

/**Utility types */
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Async<T> = Promise<T>;
export type AsyncResult<T, E = string> = Promise<Result<T, E>>;
export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;
