'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { GraduationCap, Mail, Lock, Eye, EyeOff, User, Phone, Building, BookOpen, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    university: 'Chandigarh University', department: 'MCA', semester: '3',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { confirmPassword, ...data } = form;
      await register({ ...data, semester: parseInt(data.semester) });
      toast.success('Account created! Welcome to SmartLearn!');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const field = (name, label, type = 'text', icon, placeholder, required = true) => (
    <div>
      <label className="text-sm font-medium text-slate-300 mb-1.5 block">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>
        <input
          type={type}
          value={form[name]}
          onChange={e => setForm({ ...form, [name]: e.target.value })}
          placeholder={placeholder}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
        />
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-6 bg-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-white">Create Account</h1>
            <p className="text-xs text-slate-400">Join 10,000+ students on SmartLearn</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('name', 'Full Name', 'text', <User className="w-4 h-4" />, 'Rahul Sharma')}
            {field('email', 'Email', 'email', <Mail className="w-4 h-4" />, 'you@example.com')}
            {field('phone', 'Phone', 'tel', <Phone className="w-4 h-4" />, '9876543210', false)}
            {field('university', 'University', 'text', <Building className="w-4 h-4" />, 'Chandigarh University')}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 block">Department</label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  value={form.department}
                  onChange={e => setForm({ ...form, department: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 block">Semester</label>
              <select
                value={form.semester}
                onChange={e => setForm({ ...form, semester: e.target.value })}
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-all"
              >
                {[1, 2, 3, 4, 5, 6].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">Password <span className="text-red-400">*</span></label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Min 6 characters"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-12 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">Confirm Password <span className="text-red-400">*</span></label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Repeat password"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-60"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><UserPlus className="w-4 h-4" /> Create Account</>}
          </motion.button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
