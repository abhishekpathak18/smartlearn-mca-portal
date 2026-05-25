'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronLeft, ChevronRight, Send, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';

function formatSecs(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export default function TakeTestPage() {
  const params = useParams();
  const router = useRouter();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    api.get(`/tests/${params.id}`).then(r => {
      const t = r.data?.data;
      setTest(t);
      setTimeLeft((t?.duration || 30) * 60);
      setLoading(false);
    }).catch(() => { toast.error('Test not found'); router.push('/tests'); });
  }, [params.id]);

  useEffect(() => {
    if (!test || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [test]);

  const handleSubmit = useCallback(async (auto = false) => {
    if (submitting) return;
    setSubmitting(true);
    setShowConfirm(false);
    clearInterval(timerRef.current);
    try {
      const answerArray = test.questions.map((_, i) => ({
        questionIndex: i,
        selectedAnswer: answers[i] ?? -1,
      }));
      const res = await api.post(`/tests/${params.id}/submit`, { answers: answerArray, timeTaken: (test.duration * 60) - timeLeft });
      if (auto) toast('Time up! Auto-submitted.', { icon: '⏰' });
      else toast.success('Test submitted!');
      router.push(`/results?highlight=${res.data?.data?._id || ''}`);
    } catch (err) {
      toast.error('Submission failed. Try again.');
      setSubmitting(false);
    }
  }, [answers, test, timeLeft, params.id, submitting]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;
  if (!test) return null;

  const q = test.questions[current];
  const answered = Object.keys(answers).length;
  const danger = timeLeft < 60;
  const warn = timeLeft < 300;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-white text-sm">{test.title}</h1>
          <p className="text-xs text-slate-400">{answered}/{test.questions.length} answered</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-sm ${danger ? 'bg-red-500/20 text-red-400 animate-pulse' : warn ? 'bg-yellow-500/20 text-yellow-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
          <Clock className="w-4 h-4" />{formatSecs(timeLeft)}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all" style={{ width: `${((current + 1) / test.questions.length) * 100}%` }} />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-start gap-3 mb-6">
            <span className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 text-sm font-bold flex items-center justify-center flex-shrink-0">{current + 1}</span>
            <p className="text-white text-base leading-relaxed">{q.question}</p>
          </div>
          <div className="space-y-3">
            {q.options.map((opt, idx) => (
              <button key={idx} onClick={() => setAnswers(prev => ({ ...prev, [current]: idx }))}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all border ${
                  answers[current] === idx
                    ? 'border-indigo-500 bg-indigo-500/20 text-white'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/30 hover:bg-white/10'
                }`}
              >
                <span className={`inline-flex w-6 h-6 rounded-full text-xs font-semibold items-center justify-center mr-3 flex-shrink-0 ${answers[current] === idx ? 'bg-indigo-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button disabled={current === 0} onClick={() => setCurrent(c => c - 1)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 disabled:opacity-40 hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-4 h-4" />Prev
        </button>

        {/* Question palette */}
        <div className="flex gap-1.5 flex-wrap justify-center flex-1">
          {test.questions.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${i === current ? 'bg-indigo-500 text-white ring-2 ring-indigo-400' : answers[i] !== undefined ? 'bg-green-500/30 text-green-300' : 'bg-white/10 text-slate-400 hover:bg-white/20'}`}>
              {i + 1}
            </button>
          ))}
        </div>

        {current < test.questions.length - 1 ? (
          <button onClick={() => setCurrent(c => c + 1)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/10 transition-colors">
            Next<ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={() => setShowConfirm(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-sm text-white font-medium hover:from-green-500 hover:to-emerald-500 transition-all">
            <Send className="w-4 h-4" />Submit
          </button>
        )}
      </div>

      {/* Submit button always visible at bottom */}
      <button onClick={() => setShowConfirm(true)} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-sm text-white font-semibold flex items-center justify-center gap-2 hover:from-indigo-500 hover:to-purple-500 transition-all">
        <Send className="w-4 h-4" />Submit Test ({answered}/{test.questions.length} answered)
      </button>

      {/* Confirm modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-800 border border-white/10 rounded-2xl p-6 max-w-sm w-full text-center">
              <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">Submit Test?</h3>
              <p className="text-slate-400 text-sm mb-4">You&apos;ve answered {answered} of {test.questions.length} questions. Unanswered questions will be marked wrong.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm hover:bg-white/10 transition-colors">Cancel</button>
                <button onClick={() => handleSubmit()} disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
                  {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle2 className="w-4 h-4" />Confirm</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
