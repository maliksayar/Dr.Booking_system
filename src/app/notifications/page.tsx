'use client';

import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const TYPE_ICONS: Record<string, string> = {
  BOOKING_CONFIRMED: '✅',
  BOOKING_CANCELLED: '❌',
  BOOKING_RESCHEDULED: '🔄',
  WAITLIST_AVAILABLE: '🔔',
  APPOINTMENT_REMINDER: '⏰',
  GENERAL: '💬',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications?limit=50');
      setNotifications(data.data);
      setUnreadCount(data.unreadCount);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markAllRead = async () => {
    setMarking(true);
    try {
      await api.patch('/notifications/read-all');
      toast.success('All marked as read');
      load();
    } catch {
      toast.error('Failed');
    } finally {
      setMarking(false);
    }
  };

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch {}
  };

  return (
    <DashboardLayout>
      <div className="page-container max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Notifications</h1>
            {unreadCount > 0 && <p className="text-slate-400 mt-1">{unreadCount} unread</p>}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} disabled={marking} className="btn-secondary text-sm py-2 px-4">
              {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div>
        ) : notifications.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.isRead && markRead(n.id)}
                className={`glass-card p-4 flex gap-3 transition-all cursor-pointer ${
                  !n.isRead ? 'border-primary-500/30 bg-primary-500/5 hover:bg-primary-500/8' : 'hover:bg-white/5'
                }`}
              >
                <span className="text-2xl flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] ?? '💬'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.isRead ? 'text-slate-400' : 'text-white'}`}>{n.message}</p>
                  <p className="text-xs text-slate-500 mt-1">{format(parseISO(n.createdAt), 'MMM d, yyyy • HH:mm')}</p>
                </div>
                {!n.isRead && (
                  <span className="w-2 h-2 rounded-full bg-primary-400 flex-shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
