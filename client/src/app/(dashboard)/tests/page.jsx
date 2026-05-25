'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck, Clock, Award, BookOpen, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const TYPE_COLORS = { quiz: 'bg-indigo-500/20 text-indigo-300', 'mock-test': 'bg-purple-500/20 text-purple-300', practice: 'bg-green-500/20 text-green-300' };
const CAT_COLORS = { programming: 'bg-blue-500/20 text-blue-300', dsa: 'bg-pink-500/20 text-pink-300', 'web-dev': 'bg-orange-500/20 text-orange-300', database: 'bg-green-500/20 text-green-300', 'ai-ml': 'bg-violet-500/20 text-violet-300', aptitude: 'bg-red-500/20 text-red-300', 'soft-skills': 'bg-teal-500/20 text-teal-300' };

export default function TestsPage() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    api.get('/tests').then(r => {
      setTests(r.data?.data?.tests || r.data?.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? tests : tests.filter(t => t.type === filter || t.category === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Tests & Quizzes</h1>
        <p className="text-slate-400 text-sm mt-1">Practice with mock tests and quizzes to ace your placements</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'quiz', 'mock-test', 'practice'].map(t => (
          <button key={t} onClick={() => setFilter(t)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${filter === t ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}>
            {t === 'all' ? 'All Tests' : t.replace('-', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="h-48 bg-white/5 border border-white/10 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16"><ClipboardCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" /><p className="text-slate-400">No tests available</p></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((test, i) => (
            <motion.div key={test._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${CAT_COLORS[test.category] || 'bg-indigo-500/20'}`}>
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <span className={`text-xs px-2 py-1 rounded-full capitalize font-medium ${TYPE_COLORS[test.type] || 'bg-slate-500/20 text-slate-300'}`}>
                  {test.type?.replace('-', ' ')}
                </span>
              </div>
              <h3 className="font-semibold text-white text-sm mb-1">{test.title}</h3>
              <p className="text-xs text-slate-400 mb-3 line-clamp-2">{test.description}</p>
              <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{test.duration}m</span>
                <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{test.questions?.length || 0} Qs</span>
                <span className="flex items-center gap-1"><Award className="w-3 h-3" />{test.totalMarks} marks</span>
              </div>
              <button onClick={() => router.push(`/tests/${test._id}`)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-sm text-white font-medium hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center justify-center gap-1">
                Start Test <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
