'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';

const TYPE_ICONS = {
  info: <Info className="w-4 h-4 text-blue-400" />,
  success: <CheckCircle className="w-4 h-4 text-green-400" />,
  warning: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
  alert: <AlertCircle className="w-4 h-4 text-red-400" />,
};
const TYPE_BG = { info: 'bg-blue-500/10 border-blue-500/20', success: 'bg-green-500/10 border-green-500/20', warning: 'bg-yellow-500/10 border-yellow-500/20', alert: 'bg-red-500/10 border-red-500/20' };

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = () => api.get('/notifications').then(r => {
    const payload = r.data?.data;
    // API returns { notifications: [], unreadCount: N, pagination: {} }
    setNotifications(Array.isArray(payload) ? payload : (payload?.notifications || []));
    setLoading(false);
  }).catch(() => setLoading(false));
  useEffect(() => { fetchNotifs(); }, []);

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`).catch(() => {});
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all').catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success('All marked as read');
  };

  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Notifications</h1>
          <p className="text-slate-400 text-sm mt-1">{unread} unread notifications</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/10 transition-colors">
            <CheckCheck className="w-4 h-4" />Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="h-16 bg-white/5 border border-white/10 rounded-xl animate-pulse" />)}</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
          <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n, i) => (
            <motion.div key={n._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              onClick={() => !n.isRead && markRead(n._id)}
              className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${n.isRead ? 'bg-white/3 border-white/5 opacity-60' : `${TYPE_BG[n.type] || 'bg-white/5 border-white/10'} hover:brightness-125`}`}
            >
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">{TYPE_ICONS[n.type] || TYPE_ICONS.info}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm">{n.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
                <p className="text-xs text-slate-600 mt-1">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.isRead && <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-2" />}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
