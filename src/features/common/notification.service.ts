/*
AIDDE TRACE HEADER
File: notification.service.ts
Feature: Modular notification system for workflow/admin events
Why: User feedback and event alerts
*/
export type NotificationType = 'info' | 'success' | 'error' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: number;
}

export class NotificationService {
  private listeners: ((n: Notification) => void)[] = [];

  notify(type: NotificationType, message: string) {
    const notification: Notification = {
      id: Math.random().toString(36).slice(2),
      type,
      message,
      timestamp: Date.now(),
    };
    this.listeners.forEach(fn => fn(notification));
  }

  onNotify(fn: (n: Notification) => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }
}

export const notificationService = new NotificationService();
