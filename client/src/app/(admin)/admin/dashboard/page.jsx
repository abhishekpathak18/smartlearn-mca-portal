'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, ClipboardCheck, TrendingUp, Activity, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

function StatCard({ title, value, icon: Icon, color, loading }) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-5 ${loading ? 'animate-pulse' : ''}`}>
      <div className="flex items-start justify-between">
        <div><p className="text-sm text-slate-400 mb-1">{title}</p><p className="text-3xl font-bold font-display text-white">{loading ? '—' : value}</p></div>
        <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center`}><Icon className="w-5 h-5 text-white" /></div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    Promise.all([api.get('/admin/dashboard'), api.get('/admin/activity-logs?limit=8')])
      .then(([statsRes, logsRes]) => {
        setStats(statsRes.data?.data);
        setLogs(logsRes.data?.data?.logs || logsRes.data?.data || []);
      }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const categoryData = stats?.coursesByCategory || [
    { name: 'Programming', value: 4 }, { name: 'DSA', value: 2 },
    { name: 'Web Dev', value: 3 }, { name: 'AI/ML', value: 2 }, { name: 'Aptitude', value: 1 },
  ];

  const registrationData = stats?.registrationTrend || Array.from({ length: 7 }, (_, i) => ({
    name: `Day ${i + 1}`, users: Math.floor(Math.random() * 20) + 5,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Platform overview and analytics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'bg-indigo-500/20' },
          { title: 'Total Courses', value: stats?.totalCourses || 0, icon: BookOpen, color: 'bg-purple-500/20' },
          { title: 'Total Tests', value: stats?.totalTests || 0, icon: ClipboardCheck, color: 'bg-cyan-500/20' },
          { title: 'Avg Score', value: `${Math.round(stats?.averageScore || 0)}%`, icon: TrendingUp, color: 'bg-green-500/20' },
        ].map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <StatCard {...s} loading={loading} />
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-4">User Registrations (7 days)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={registrationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f1f5f9', fontSize: 12 }} />
              <Bar dataKey="users" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-4">Courses by Category</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10} fill="#6366f1">
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f1f5f9', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity Logs */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-400" />Recent Activity</h2>
        {logs.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log, i) => (
              <div key={log._id || i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div>
                  <p className="text-sm text-white font-medium">{log.user?.name || 'Unknown'}</p>
                  <p className="text-xs text-slate-400">{log.action} · {log.details}</p>
                </div>
                <span className="text-xs text-slate-500 flex-shrink-0">{formatDate(log.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
