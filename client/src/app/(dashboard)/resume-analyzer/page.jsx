'use client';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Sparkles, CheckCircle, AlertCircle, Lightbulb, BarChart2 } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

function ScoreBar({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-1"><span>{label}</span><span className="text-white font-medium">{value}%</span></div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8, delay: 0.2 }} className={`h-full rounded-full ${color}`} />
      </div>
    </div>
  );
}

export default function ResumeAnalyzerPage() {
  const [resumeText, setResumeText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!resumeText.trim() || resumeText.length < 50) {
      toast.error('Please paste your resume text (at least 50 characters)');
      return;
    }
    setLoading(true);
    setAnalysis(null);
    try {
      const res = await api.post('/ai/resume-analyze', { resumeText });
      setAnalysis(res.data?.data?.analysis);
      toast.success('Resume analyzed!');
    } catch {
      toast.error('Analysis failed. Check your API key or try again.');
    }
    setLoading(false);
  };

  const score = analysis?.overallScore || 0;
  const scoreColor = score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold font-display bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">AI Resume Analyzer</h1>
        <p className="text-slate-400 text-sm mt-1">Get instant AI feedback on your resume powered by Google Gemini</p>
      </div>

      {/* Input */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />Paste Your Resume Text
        </label>
        <textarea
          value={resumeText}
          onChange={e => setResumeText(e.target.value)}
          placeholder={`Paste your complete resume text here...\n\nInclude:\n• Work experience\n• Skills\n• Education\n• Projects\n• Certifications`}
          className="w-full h-48 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none transition-all"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">{resumeText.length} characters</p>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={analyze} disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm flex items-center gap-2 disabled:opacity-60 hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/20">
            {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing...</> : <><Sparkles className="w-4 h-4" />Analyze Resume</>}
          </motion.button>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {analysis && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Overall Score */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-6">
              <div className="text-center">
                <div className={`text-5xl font-bold font-display ${scoreColor}`}>{score}</div>
                <div className="text-xs text-slate-400 mt-1">Overall Score</div>
              </div>
              <div className="flex-1 space-y-3">
                <ScoreBar label="Content Quality" value={analysis.contentScore || 0} color="bg-indigo-500" />
                <ScoreBar label="Formatting" value={analysis.formattingScore || 0} color="bg-purple-500" />
                <ScoreBar label="Keyword Match" value={analysis.keywordMatch || 0} color="bg-cyan-500" />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {/* Strengths */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-green-400 flex items-center gap-2 mb-3"><CheckCircle className="w-4 h-4" />Strengths</h3>
                <ul className="space-y-2">{(analysis.strengths || []).map((s, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span>{s}</li>)}</ul>
              </div>
              {/* Improvements */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2 mb-3"><AlertCircle className="w-4 h-4" />Improve</h3>
                <ul className="space-y-2">{(analysis.improvements || []).map((s, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><span className="text-red-400 mt-0.5">!</span>{s}</li>)}</ul>
              </div>
              {/* Suggestions */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-yellow-400 flex items-center gap-2 mb-3"><Lightbulb className="w-4 h-4" />Tips</h3>
                <ul className="space-y-2">{(analysis.suggestions || []).map((s, i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-2"><span className="text-yellow-400 mt-0.5">💡</span>{s}</li>)}</ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
