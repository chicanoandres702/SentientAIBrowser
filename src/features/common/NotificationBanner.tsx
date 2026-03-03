/*
AIDDE TRACE HEADER
File: NotificationBanner.tsx
Feature: Notification banner for workflow/admin events
Why: Real-time user feedback and alerts
*/
import React, { useEffect, useState } from 'react';
import { notificationService, Notification } from './notification.service';

const NotificationBanner: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const unsubscribe = notificationService.onNotify(n => {
      setNotifications(prev => [n, ...prev].slice(0, 3));
      setTimeout(() => {
        setNotifications(prev => prev.filter(x => x.id !== n.id));
      }, 5000);
    });
    return unsubscribe;
  }, []);

  return (
    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 1000, maxWidth: '90vw' }} role="status" aria-live="polite">
      {notifications.map(n => (
        <div key={n.id} style={{
          background: n.type === 'error' ? '#ffdddd' : n.type === 'success' ? '#ddffdd' : '#eeeeee',
          color: '#222',
          border: '1px solid #ccc',
          borderRadius: 6,
          padding: '8px 16px',
          marginBottom: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          fontSize: '1rem',
          wordBreak: 'break-word',
          maxWidth: '100%',
        }}>
          {n.message}
        </div>
      ))}
    </div>
  );
};

export default NotificationBanner;
