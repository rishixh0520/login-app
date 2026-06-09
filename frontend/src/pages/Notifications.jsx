import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Bell } from 'lucide-react';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications/mine');
      setNotifications(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      loadNotifications();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Notifications</h1>
          <p>Updates on your assets and workflow actions</p>
        </div>
      </header>

      <div className="card">
        {notifications.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {notifications.map(n => (
              <li key={n.id} style={{ 
                padding: '1rem', 
                border: '1px solid var(--border)', 
                borderRadius: '8px', 
                backgroundColor: n.is_read ? 'transparent' : 'var(--bg-secondary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Bell size={16} /> {n.title}
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{n.message}</p>
                  <small style={{ color: 'var(--text-tertiary)', marginTop: '0.5rem', display: 'block' }}>{new Date(n.created_at).toLocaleString()}</small>
                </div>
                {!n.is_read && (
                  <button className="btn-primary btn-small" onClick={() => handleMarkAsRead(n.id)}>Mark as read</button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No notifications.</p>
        )}
      </div>
    </div>
  );
}
