// Feature: Session Manager Service | Trace: src/features/core/sessionManager.service.ts
/*
AIDDE TRACE HEADER
File: sessionManager.service.ts
Feature: Centralized session management for browser
Why: Traceability, session lifecycle, and debugging
*/

export class SessionManager {
  private sessions: Record<string, any> = {};

  createSession(id: string, data: any) {
    this.sessions[id] = { ...data, created: Date.now() };
  }

  getSession(id: string) {
    return this.sessions[id];
  }

  updateSession(id: string, updates: any) {
    if (this.sessions[id]) {
      this.sessions[id] = { ...this.sessions[id], ...updates };
    }
  }

  removeSession(id: string) {
    delete this.sessions[id];
  }

  listSessions() {
    return Object.keys(this.sessions);
  }
}

export const sessionManager = new SessionManager();
