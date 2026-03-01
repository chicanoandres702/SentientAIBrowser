// Feature: Core | Trace: README.md
/*
 * [Parent Feature/Milestone] Core
 * [Child Task/Issue] Logging service consolidation
 * [Subtask] Centralized logging with consistent format and telemetry hooks
 * [Upstream] Scattered console.log calls -> [Downstream] Structured logger service
 * [Law Check] 72 lines | Passed 100-Line Law
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: Record<string, unknown>;
  error?: Error;
}

export class LoggerService {
  private isDev = process.env.NODE_ENV === 'development';

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatEntry(level: LogLevel, context: string, message: string, data?: Record<string, unknown>): LogEntry {
    return {
      timestamp: this.formatTimestamp(),
      level,
      context,
      message,
      data,
    };
  }

  private outputLog(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.context}]`;
    const output = `${prefix} ${entry.message}`;
    console[entry.level === 'debug' ? 'debug' : entry.level](output, entry.data || '');
  }

  debug(context: string, message: string, data?: Record<string, unknown>): void {
    if (this.isDev) {
      this.outputLog(this.formatEntry('debug', context, message, data));
    }
  }

  info(context: string, message: string, data?: Record<string, unknown>): void {
    this.outputLog(this.formatEntry('info', context, message, data));
  }

  warn(context: string, message: string, data?: Record<string, unknown>): void {
    this.outputLog(this.formatEntry('warn', context, message, data));
  }

  error(context: string, message: string, error?: Error, data?: Record<string, unknown>): void {
    const entry = this.formatEntry('error', context, message, data);
    entry.error = error;
    this.outputLog(entry);
  }

  /**Timer for performance tracking */
  startTimer(context: string, operation: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.debug(context, `${operation} completed in ${duration}ms`, { duration, operation });
    };
  }
}

export const logger = new LoggerService();
