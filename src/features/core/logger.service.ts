// Feature: Logger Service | Trace: src/features/core/logger.service.ts
/*
AIDDE TRACE HEADER
File: logger.service.ts
Feature: Centralized logging for browser and workflow events
Why: Debugging, traceability, and audit
*/

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export class Logger {
  logs: Array<{ level: LogLevel; message: string; timestamp: number }> = [];

  log(level: LogLevel, message: string) {
    this.logs.push({ level, message, timestamp: Date.now() });
    if (level === 'error') {
      // Example: send error to remote endpoint
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, timestamp: Date.now() }),
      });
    }
  }

  info(message: string) { this.log('info', message); }
  warn(message: string) { this.log('warn', message); }
  error(message: string) { this.log('error', message); }
  debug(message: string) { this.log('debug', message); }

  getLogs(level?: LogLevel) {
    return level ? this.logs.filter(l => l.level === level) : this.logs;
  }

  clear() {
    this.logs = [];
  }
}

export const logger = new Logger();
