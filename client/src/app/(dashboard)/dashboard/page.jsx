'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  BookOpen, ClipboardCheck, TrendingUp, Flame, ArrowRight,
  Bot, Mic, FileText, BarChart2
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { formatDate, getScoreColor, getScoreBgColor } from '@/lib/utils';

// Animated stat card component
function StatCard({ title, value, icon: Icon, color, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl hover:border-white/20 transition-all"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-16 bg-white/10 rounded animate-pulse" />
          ) : (
            <p className="text-3xl font-bold font-display text-white">{value}</p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

// Custom tooltip for charts
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="text-indigo-400 font-semibold">{payload[0].value}%</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ enrolled: 0, testsCompleted: 0, avgScore: 0, streak: 0 });
  const [results, setResults] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, resultsRes] = await Promise.all([
          api.get('/analytics'),
          api.get('/results'),
        ]);
        const analytics = analyticsRes.data?.data || {};
        const resultsPayload = resultsRes.data?.data;
        // Results API returns { results: [], summary: {}, pagination: {} }
        const allResults = Array.isArray(resultsPayload)
          ? resultsPayload
          : (resultsPayload?.results || []);

        setStats({
          enrolled: analytics.totalCoursesEnrolled || 0,
          testsCompleted: analytics.totalTests || 0,
          avgScore: analytics.averageScore ? Math.round(analytics.averageScore) : 0,
          streak: analytics.currentStreak || 0,
        });

        // Last 5 results
        setResults(allResults.slice(0, 5));

        // Chart: last 7 results as trend
        const chartPoints = allResults.slice(0, 7).reverse().map((r, i) => ({
          name: `Test ${i + 1}`,
          score: r.percentage || 0,
        }));
        setChartData(chartPoints.length > 0 ? chartPoints : [
          { name: 'Day 1', score: 60 }, { name: 'Day 2', score: 70 },
          { name: 'Day 3', score: 65 }, { name: 'Day 4', score: 80 },
          { name: 'Day 5', score: 75 },
        ]);
      } catch {
        // Use placeholder data
        setChartData([
          { name: 'Day 1', score: 60 }, { name: 'Day 2', score: 70 },
          { name: 'Day 3', score: 65 }, { name: 'Day 4', score: 80 },
          { name: 'Day 5', score: 75 }, { name: 'Day 6', score: 82 },
          { name: 'Day 7', score: 88 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const quickActions = [
    { label: 'Take a Test', icon: ClipboardCheck, href: '/tests', color: 'from-indigo-500 to-blue-600', desc: 'Practice & improve' },
    { label: 'AI Interview Prep', icon: Mic, href: '/interview-prep', color: 'from-purple-500 to-violet-600', desc: 'Generate questions' },
    { label: 'Resume Analyzer', icon: FileText, href: '/resume-analyzer', color: 'from-pink-500 to-rose-600', desc: 'Get AI feedback' },
    { label: 'AI Assistant', icon: Bot, href: '/ai-assistant', color: 'from-cyan-500 to-teal-600', desc: 'Chat & learn' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-2xl p-6"
      >
        <h1 className="text-2xl font-bold font-display text-white">
          {getGreeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Sem {user?.semester} · {user?.department} · {user?.university}
        </p>
        <p className="text-indigo-300 text-sm mt-2">Keep up the great work! Your placement journey is on track.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Courses Enrolled', value: stats.enrolled, icon: BookOpen, color: 'bg-indigo-500/20' },
          { title: 'Tests Completed', value: stats.testsCompleted, icon: ClipboardCheck, color: 'bg-green-500/20' },
          { title: 'Average Score', value: `${stats.avgScore}%`, icon: TrendingUp, color: 'bg-purple-500/20' },
          { title: 'Study Streak', value: `${stats.streak}d`, icon: Flame, color: 'bg-orange-500/20' },
        ].map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <StatCard {...s} loading={loading} />
          </motion.div>
        ))}
      </div>

      {/* Charts + Recent Results */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl"
        >
          <h2 className="text-base font-semibold text-white mb-4">Performance Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="score" stroke="#6366f1" fill="url(#scoreGrad)" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Recent Results</h2>
            <button onClick={() => router.push('/results')} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />)}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8">
              <BarChart2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No tests taken yet</p>
              <button onClick={() => router.push('/tests')} className="text-indigo-400 text-xs mt-1 hover:underline">Take your first test →</button>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((r) => (
                <div key={r._id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-white truncate max-w-[160px]">{r.test?.title || 'Test'}</p>
                    <p className="text-xs text-slate-500">{formatDate(r.submittedAt)}</p>
                  </div>
                  <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${getScoreBgColor(r.percentage)}`}>
                    {r.percentage}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h2 className="text-base font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map(({ label, icon: Icon, href, color, desc }) => (
            <motion.button
              key={label}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(href)}
              className="p-4 bg-white/5 border border-white/10 rounded-2xl text-left hover:border-white/20 hover:bg-white/10 transition-all"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-semibold text-white">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
