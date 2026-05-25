'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, CheckCircle, XCircle, Clock, Award } from 'lucide-react';
import api from '@/lib/api';
import { formatDate, getScoreBgColor } from '@/lib/utils';

export default function ResultsPage() {
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/results').then(r => {
      // API returns: { data: { results: [], summary: {}, pagination: {} } }
      const payload = r.data?.data;
      if (Array.isArray(payload)) {
        // fallback if server ever returns plain array
        setResults(payload);
      } else {
        setResults(payload?.results || []);
        setSummary(payload?.summary || null);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">My Results</h1>
        <p className="text-slate-400 text-sm mt-1">Review your test performance and track improvement</p>
      </div>

      {/* Summary stats bar */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Tests Taken', value: summary.totalTests, icon: <BarChart2 className="w-4 h-4" /> },
            { label: 'Avg Score', value: `${Math.round(summary.averageScore)}%`, icon: <Award className="w-4 h-4" /> },
            { label: 'Passed', value: summary.totalPassed, icon: <CheckCircle className="w-4 h-4 text-green-400" /> },
            { label: 'Pass Rate', value: `${summary.passRate}%`, icon: <Clock className="w-4 h-4" /> },
          ].map(stat => (
            <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
              <div className="text-indigo-400">{stat.icon}</div>
              <div>
                <p className="text-xs text-slate-400">{stat.label}</p>
                <p className="text-sm font-bold text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="h-16 bg-white/5 border border-white/10 rounded-xl animate-pulse" />)}</div>
      ) : results.length === 0 ? (
        <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
          <BarChart2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No results yet. Take your first test!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((r, i) => (
            <motion.div key={r._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-white/20 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <BarChart2 className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="font-medium text-white text-sm">{r.test?.title || 'Test'}</p>
                  <p className="text-xs text-slate-500">{formatDate(r.submittedAt)} · {Math.floor(r.timeTaken / 60)}m taken</p>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-slate-400">Score</p>
                  <p className="text-sm font-semibold text-white">{r.score}/{r.totalMarks}</p>
                </div>
                <span className={`text-sm font-bold px-3 py-1.5 rounded-xl ${getScoreBgColor(r.percentage)}`}>
                  {r.percentage}%
                </span>
                {r.percentage >= (r.passingMarks ? (r.passingMarks / r.totalMarks) * 100 : 50) ? (
                  <CheckCircle className="w-5 h-5 text-green-400 hidden sm:block" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 hidden sm:block" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
