'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { toast.error('Please enter your email'); return; }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Reset link sent! Check your email.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto p-8 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl"
    >
      <h1 className="text-2xl font-bold font-display text-white mb-2">Forgot Password?</h1>
      <p className="text-slate-400 text-sm mb-6">Enter your email and we'll send you a reset link.</p>

      {sent ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-white font-semibold mb-2">Email Sent!</h2>
          <p className="text-slate-400 text-sm">Check your inbox for the password reset link.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Send Reset Link'}
          </button>
        </form>
      )}

      <Link href="/login" className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 mt-6">
        <ArrowLeft className="w-4 h-4" /> Back to Login
      </Link>
    </motion.div>
  );
}
