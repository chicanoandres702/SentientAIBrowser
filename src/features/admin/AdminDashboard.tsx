/*
AIDDE TRACE HEADER
File: AdminDashboard.tsx
Feature: React admin dashboard for session/stream monitoring
Why: Real-time admin controls and visibility
*/
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import NotificationBanner from '../common/NotificationBanner';

const AdminDashboard: React.FC = () => {
  const [sessions, setSessions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    axios.get('/admin/sessions').then(res => setSessions(res.data.sessions));
  }, []);

  useEffect(() => {
    if (selected) {
      axios.get(`/admin/session/${selected}`).then(res => setDetails(res.data));
    }
  }, [selected]);

  return (
    <div style={{ padding: 24 }}>
      <NotificationBanner />
      <h2>Admin Dashboard</h2>
      <ul aria-label="Active Sessions">
        {sessions.map(s => (
          <li key={s}>
            <button
              onClick={() => setSelected(s)}
              aria-label={`Select session ${s}`}
              style={{ outline: 'none', borderRadius: 4, padding: '4px 12px', margin: '2px' }}
              onFocus={e => (e.currentTarget.style.outline = '2px solid #007bff')}
              onBlur={e => (e.currentTarget.style.outline = 'none')}
            >
              {s}
            </button>
          </li>
        ))}
      </ul>
      {details && (
        <div>
          <h3>Session: {details.userId}</h3>
          <ul aria-label="Session Pages">
            {details.pages.map((url: string, i: number) => (
              <li key={i}>{url}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
