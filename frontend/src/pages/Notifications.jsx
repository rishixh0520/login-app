import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Bell, Check, Inbox } from 'lucide-react';
import AnimatedCard from '../components/AnimatedCard';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

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
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      toast.success('Marked as read');
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      // Assuming a hypothetical endpoint or just doing it individually
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => api.put(`/notifications/${n.id}/read`)));
      loadNotifications();
      toast.success('All marked as read');
    } catch (e) {
      toast.error('Action failed');
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Notifications</h1>
          <p>Updates on your assets and workflow actions</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn-secondary" onClick={markAllAsRead} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={16} /> Mark all read
          </button>
        )}
      </header>

      <AnimatedCard style={{ padding: 0, overflow: 'hidden' }}>
        {notifications.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <AnimatePresence>
              {notifications.map((n, index) => (
                <motion.div 
                  key={n.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  style={{ 
                    padding: '20px', 
                    borderBottom: '1px solid var(--border-light)', 
                    background: n.is_read ? 'transparent' : 'var(--primary-light)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '16px',
                    transition: 'background 0.3s'
                  }}
                >
                  <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: n.is_read ? 'var(--panel-bg)' : 'var(--primary)', color: n.is_read ? 'var(--text-muted)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: n.is_read ? '1px solid var(--border-color)' : 'none' }}>
                      <Bell size={18} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: n.is_read ? 'var(--text-main)' : 'var(--primary)' }}>
                        {n.title}
                      </h4>
                      <p style={{ margin: '0 0 8px 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>{n.message}</p>
                      <small style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>{new Date(n.created_at).toLocaleString()}</small>
                    </div>
                  </div>
                  {!n.is_read && (
                    <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleMarkAsRead(n.id)}>Mark Read</button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div style={{ padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--panel-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
              <Inbox size={32} style={{ color: 'var(--text-soft)' }} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-main)' }}>You're all caught up!</h3>
            <p style={{ margin: 0 }}>No new notifications right now.</p>
          </div>
        )}
      </AnimatedCard>
    </div>
  );
}
