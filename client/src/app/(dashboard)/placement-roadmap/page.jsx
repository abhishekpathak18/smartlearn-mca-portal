'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Sparkles, CheckSquare, Square, Calendar } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const PHASE_COLORS = {
  0: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-500' },
  1: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400', dot: 'bg-purple-500' },
  2: { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-400', dot: 'bg-green-500' },
  3: { bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-400', dot: 'bg-orange-500' },
};

export default function PlacementRoadmapPage() {
  const { user } = useAuth();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState({});

  const generateRoadmap = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ai/placement-roadmap');
      setRoadmap(res.data?.data?.roadmap || res.data?.data);
      toast.success('Personalized roadmap generated!');
    } catch {
      toast.error('Failed to generate roadmap. Try again.');
    }
    setLoading(false);
  };

  const toggleTask = (weekIdx, taskIdx) => {
    const key = `${weekIdx}-${taskIdx}`;
    setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold font-display bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Placement Preparation Roadmap</h1>
        <p className="text-slate-400 text-sm mt-1">Get a personalized week-by-week plan to ace your placement</p>
      </div>

      {!roadmap && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <Map className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-white font-semibold mb-2">Generate Your Personalized Roadmap</h2>
          <p className="text-slate-400 text-sm mb-6">AI will create a customized week-by-week placement preparation plan based on your profile: {user?.department}, Semester {user?.semester}</p>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={generateRoadmap} disabled={loading}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold flex items-center gap-2 mx-auto disabled:opacity-60 hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/20">
            {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4" />Generate My Roadmap</>}
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {roadmap && Array.isArray(roadmap) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">{roadmap.length} weeks plan generated</p>
              <button onClick={() => { setRoadmap(null); setChecked({}); }} className="text-xs text-indigo-400 hover:text-indigo-300">Regenerate</button>
            </div>
            {roadmap.map((week, wi) => {
              const colors = PHASE_COLORS[wi % 4];
              const weekTasks = week.tasks || [];
              const doneCount = weekTasks.filter((_, ti) => checked[`${wi}-${ti}`]).length;
              return (
                <motion.div key={wi} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: wi * 0.05 }}
                  className={`${colors.bg} border ${colors.border} rounded-2xl p-5`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-8 h-8 rounded-full ${colors.dot} flex items-center justify-center text-white text-xs font-bold`}>{wi + 1}</div>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${colors.text}`}>{week.title || `Week ${wi + 1}`}</h3>
                      <p className="text-xs text-slate-400">{doneCount}/{weekTasks.length} tasks completed</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400"><Calendar className="w-3 h-3" />Week {wi + 1}</div>
                  </div>
                  {week.description && <p className="text-sm text-slate-300 mb-3">{week.description}</p>}
                  <div className="space-y-2">
                    {weekTasks.map((task, ti) => {
                      const done = checked[`${wi}-${ti}`];
                      return (
                        <button key={ti} onClick={() => toggleTask(wi, ti)} className="flex items-center gap-2 w-full text-left group">
                          {done ? <CheckSquare className={`w-4 h-4 flex-shrink-0 ${colors.text}`} /> : <Square className="w-4 h-4 flex-shrink-0 text-slate-500 group-hover:text-slate-300" />}
                          <span className={`text-sm ${done ? `line-through ${colors.text} opacity-60` : 'text-slate-300'} transition-all`}>{task}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
        {roadmap && !Array.isArray(roadmap) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <pre className="text-sm text-slate-300 whitespace-pre-wrap">{JSON.stringify(roadmap, null, 2)}</pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
