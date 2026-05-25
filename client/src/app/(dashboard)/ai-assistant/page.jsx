'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { timeAgo } from '@/lib/utils';

const QUICK_PROMPTS = [
  'How to prepare for TCS interview?',
  'What are common DSA interview questions?',
  'How to improve my resume?',
  'Give me a 30-day placement roadmap',
  'Best resources to learn System Design',
];

export default function AIAssistantPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'ai', content: `Hi ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm SmartLearn AI, your placement preparation assistant. I can help you with:\n\n• Interview preparation tips\n• Resume improvement advice\n• Placement roadmaps\n• DSA concepts\n• Career guidance\n\nWhat would you like to work on today?`, time: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (text = input) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: 'user', content: text.trim(), time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const context = messages.slice(-6).map(m => ({ role: m.role === 'ai' ? 'model' : 'user', content: m.content }));
      const res = await api.post('/ai/chat', { message: text.trim(), context });
      setMessages(prev => [...prev, { role: 'ai', content: res.data?.data?.reply || 'Sorry, I could not respond. Please try again.', time: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I am having trouble connecting. Please check your internet connection and try again.', time: new Date() }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl">
      {/* Header */}
      <div className="bg-white/5 border border-white/10 rounded-t-2xl p-4 flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-semibold text-white text-sm">SmartLearn AI</h1>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /><span className="text-xs text-green-400">Online</span></div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
        {messages.map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'ai' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-cyan-500 to-teal-600'}`}>
              {msg.role === 'ai' ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
            </div>
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'ai' ? 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-sm' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-sm'
              }`}>{msg.content}</div>
              <span className="text-xs text-slate-600">{timeAgo(msg.time)}</span>
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} /><div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} /><div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} /></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto flex-shrink-0 bg-slate-900/50">
        {QUICK_PROMPTS.map(p => (
          <button key={p} onClick={() => sendMessage(p)} className="flex-shrink-0 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white hover:border-indigo-500/50 transition-all whitespace-nowrap">
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="bg-white/5 border-t border-white/10 rounded-b-2xl p-4 flex-shrink-0">
        <div className="flex gap-3">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()} placeholder="Ask anything about placements, interviews, DSA..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => sendMessage()} disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white disabled:opacity-40 transition-all flex-shrink-0">
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
