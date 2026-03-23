// Feature: NotificationBanner | Trace: src/features/common/NotificationBanner.tsx
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
  const [customBanner, setCustomBanner] = useState<{ message: string; type: Notification['type']; visible: boolean } | null>(null);

  useEffect(() => {
    const unsubscribe = notificationService.onNotify(n => {
      if (n.type === 'custom') {
        setCustomBanner({ message: n.message, type: n.type, visible: true });
        setTimeout(() => setCustomBanner(null), 7000);
        return;
      }
      setNotifications(prev => [n, ...prev].slice(0, 3));
      setTimeout(() => {
        setNotifications(prev => prev.filter(x => x.id !== n.id));
      }, 5000);
    });
    return unsubscribe;
  }, []);

  return (
    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 1000, maxWidth: '90vw' }} role="status" aria-live="polite">
      {customBanner && customBanner.visible && (
        <div style={{
          background: '#222',
          color: '#fff',
          border: '2px solid #007bff',
          borderRadius: 8,
          padding: '12px 24px',
          marginBottom: 12,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          textAlign: 'center',
        }}>
          {customBanner.message}
        </div>
      )}
      {(Array.isArray(notifications) ? notifications : []).map(n => (
        <div key={n.id} style={{
          background: n.type === 'error' ? '#ffdddd' : n.type === 'success' ? '#ddffdd' : n.type === 'warning' ? '#fffbe6' : '#eeeeee',
          color: n.type === 'error' ? '#b20000' : n.type === 'warning' ? '#b28500' : '#222',
          border: n.type === 'error' ? '2px solid #b20000' : n.type === 'warning' ? '2px solid #b28500' : '1px solid #ccc',
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
