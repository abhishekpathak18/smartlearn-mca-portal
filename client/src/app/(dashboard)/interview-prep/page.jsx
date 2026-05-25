'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Brain, ChevronDown, ChevronUp, Sparkles, RotateCcw } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const TOPICS = ['JavaScript', 'React.js', 'Node.js', 'Python', 'DSA', 'SQL', 'System Design', 'MongoDB', 'Java', 'Machine Learning', 'Cloud Computing', 'DevOps'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

function QuestionCard({ q, index }) {
  const [open, setOpen] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}
      className="bg-white/5 border border-white/10 rounded-2xl p-5"
    >
      <div className="flex items-start gap-3">
        <span className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center flex-shrink-0">{index + 1}</span>
        <div className="flex-1">
          <p className="text-white text-sm font-medium leading-relaxed">{q.question}</p>
          {q.category && <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">{q.category}</span>}
          {/* Expected Answer */}
          <button onClick={() => setOpen(!open)} className="flex items-center gap-1 mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-medium">
            {open ? <><ChevronUp className="w-3 h-3" />Hide Answer</> : <><ChevronDown className="w-3 h-3" />Show Expected Answer</>}
          </button>
          <AnimatePresence>
            {open && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-2"
              >
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-sm text-slate-300">{q.expectedAnswer}</div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Tips */}
          {q.tips && (
            <>
              <button onClick={() => setTipsOpen(!tipsOpen)} className="flex items-center gap-1 mt-2 text-xs text-yellow-400 hover:text-yellow-300 font-medium">
                {tipsOpen ? <><ChevronUp className="w-3 h-3" />Hide Tips</> : <><ChevronDown className="w-3 h-3" />Interview Tips</>}
              </button>
              <AnimatePresence>
                {tipsOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-2">
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-sm text-slate-300">{q.tips}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function InterviewPrepPage() {
  const [config, setConfig] = useState({ topic: 'JavaScript', difficulty: 'medium', count: 10 });
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setQuestions([]);
    try {
      const res = await api.post('/ai/interview-questions', config);
      const qs = res.data?.data?.questions || [];
      if (qs.length === 0) throw new Error('No questions returned');
      setQuestions(qs);
      toast.success(`${qs.length} questions generated!`);
    } catch {
      toast.error('Failed to generate questions. Check your API key or try again.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold font-display bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">AI Interview Preparation</h1>
        <p className="text-slate-400 text-sm mt-1">Generate personalized interview questions powered by Google Gemini AI</p>
      </div>

      {/* Config card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
        <h2 className="text-base font-semibold text-white flex items-center gap-2"><Brain className="w-5 h-5 text-indigo-400" />Configure Questions</h2>
        
        {/* Topic */}
        <div>
          <label className="text-sm font-medium text-slate-300 mb-2 block">Topic</label>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map(t => (
              <button key={t} onClick={() => setConfig(c => ({ ...c, topic: t }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${config.topic === t ? 'bg-indigo-500 text-white' : 'bg-white/5 border border-white/10 text-slate-400 hover:border-white/30 hover:text-white'}`}>
                {t}
              </button>
            ))}
          </div>
          <input value={config.topic} onChange={e => setConfig(c => ({ ...c, topic: e.target.value }))} placeholder="Or type a custom topic..."
            className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-300 placeholder-slate-500 outline-none focus:border-indigo-500 transition-all" />
        </div>

        {/* Difficulty */}
        <div>
          <label className="text-sm font-medium text-slate-300 mb-2 block">Difficulty</label>
          <div className="flex gap-2">
            {DIFFICULTIES.map(d => (
              <button key={d} onClick={() => setConfig(c => ({ ...c, difficulty: d }))}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all capitalize ${config.difficulty === d ? (d === 'easy' ? 'bg-green-500 text-white' : d === 'medium' ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white') : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'}`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <div>
          <label className="text-sm font-medium text-slate-300 mb-2 block">Number of Questions: <span className="text-indigo-400">{config.count}</span></label>
          <input type="range" min={5} max={20} value={config.count} onChange={e => setConfig(c => ({ ...c, count: parseInt(e.target.value) }))}
            className="w-full accent-indigo-500" />
          <div className="flex justify-between text-xs text-slate-500 mt-1"><span>5</span><span>20</span></div>
        </div>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={generate} disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/20">
          {loading ? (
            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating with AI...</>
          ) : (
            <><Sparkles className="w-4 h-4" />Generate Interview Questions</>
          )}
        </motion.button>
      </div>

      {/* Questions */}
      {questions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">{questions.length} Questions Generated — {config.topic} ({config.difficulty})</h2>
            <button onClick={() => setQuestions([])} className="text-xs text-slate-400 hover:text-white flex items-center gap-1"><RotateCcw className="w-3 h-3" />Clear</button>
          </div>
          {questions.map((q, i) => <QuestionCard key={i} q={q} index={i} />)}
        </div>
      )}
    </div>
  );
}
