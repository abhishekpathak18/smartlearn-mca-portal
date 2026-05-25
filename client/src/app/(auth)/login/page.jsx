'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { GraduationCap, Mail, Lock, Eye, EyeOff, LogIn, Brain, BarChart2, Award } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success('Welcome back!');
      // Redirect based on role
      if (user?.role === 'admin') router.push('/admin/dashboard');
      else router.push('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen grid lg:grid-cols-2">
      {/* Left — Branding Panel */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold font-display text-white">SmartLearn</span>
          </div>

          <h1 className="text-4xl font-bold font-display text-white mb-4 leading-tight">
            Your AI-Powered<br />Learning Journey<br />
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Starts Here</span>
          </h1>
          <p className="text-slate-300 text-lg mb-10">Prepare for placements with AI-driven interview prep, smart quizzes, and personalized career roadmaps.</p>

          <div className="space-y-4">
            {[
              { icon: Brain, label: 'AI Interview Question Generator' },
              { icon: BarChart2, label: 'Real-time Performance Analytics' },
              { icon: Award, label: '95% Placement Success Rate' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-slate-300">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right — Login Form */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 bg-slate-900">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold font-display text-white">SmartLearn</span>
          </div>

          <h2 className="text-2xl font-bold font-display text-white mb-2">Welcome Back</h2>
          <p className="text-slate-400 mb-8 text-sm">Sign in to continue your learning journey</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-12 py-3 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                <input type="checkbox" className="rounded border-white/20" />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-sm text-indigo-400 hover:text-indigo-300">
                Forgot password?
              </Link>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><LogIn className="w-4 h-4" /> Sign In</>
              )}
            </motion.button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Create one free
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-xs font-medium text-slate-400 mb-2">Demo Credentials:</p>
            <div className="space-y-1 text-xs text-slate-500">
              <p>Student: <span className="text-slate-300">rahul@student.com / student123</span></p>
              <p>Admin: <span className="text-slate-300">admin@smartlearn.com / admin123</span></p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
