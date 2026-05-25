'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, ClipboardCheck, BarChart2, Mic, FileText,
  Bot, Map, Bell, User, Users, TrendingUp, Briefcase, Activity,
  LogOut, GraduationCap, X, ChevronRight, Flame
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

// Icon mapping
const iconMap = {
  LayoutDashboard, BookOpen, ClipboardCheck, BarChart2, Mic, FileText,
  Bot, Map, Bell, User, Users, TrendingUp, Briefcase, Activity
};

const STUDENT_NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Courses', href: '/courses', icon: 'BookOpen' },
  { label: 'Tests & Quizzes', href: '/tests', icon: 'ClipboardCheck' },
  { label: 'My Results', href: '/results', icon: 'BarChart2' },
  { label: 'Interview Prep', href: '/interview-prep', icon: 'Mic' },
  { label: 'Resume Analyzer', href: '/resume-analyzer', icon: 'FileText' },
  { label: 'AI Assistant', href: '/ai-assistant', icon: 'Bot' },
  { label: 'Placement Roadmap', href: '/placement-roadmap', icon: 'Map' },
  { label: 'Notifications', href: '/notifications', icon: 'Bell' },
  { label: 'My Profile', href: '/profile', icon: 'User' },
];

const ADMIN_NAV = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: 'LayoutDashboard' },
  { label: 'Users', href: '/admin/users', icon: 'Users' },
  { label: 'Courses', href: '/admin/courses', icon: 'BookOpen' },
  { label: 'Tests', href: '/admin/tests', icon: 'ClipboardCheck' },
  { label: 'Analytics', href: '/admin/analytics', icon: 'TrendingUp' },
  { label: 'Placements', href: '/admin/placements', icon: 'Briefcase' },
  { label: 'Activity Logs', href: '/admin/activity-logs', icon: 'Activity' },
];

export default function Sidebar({ isOpen, onClose, role = 'student' }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const navItems = role === 'admin' ? ADMIN_NAV : STUDENT_NAV;

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    return parts.length === 1 ? parts[0][0].toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold font-display bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            SmartLearn
          </span>
        </Link>
        {/* Close button — mobile only */}
        <button onClick={onClose} className={`lg:hidden ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User info */}
      {user && (
        <div className={`p-4 mx-3 mt-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm`}>
              {getInitials(user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.name}</p>
              <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user.email}</p>
            </div>
          </div>
          <div className="mt-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              user.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-indigo-500/20 text-indigo-300'
            }`}>
              {user.role === 'admin' ? '⚡ Admin' : '🎓 Student'}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href} onClick={onClose}>
              <motion.div
                whileHover={{ x: 4 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/80 to-purple-600/80 text-white shadow-lg shadow-indigo-500/20'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-white/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className={`p-3 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
        <motion.button
          whileHover={{ x: 4 }}
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </motion.button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col w-64 h-screen sticky top-0 backdrop-blur-xl border-r z-30 transition-colors duration-300 ${isDark ? 'bg-slate-900/95 border-white/10' : 'bg-white border-slate-200 shadow-md'}`}>
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="lg:hidden fixed inset-0 bg-black/60 z-40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`lg:hidden fixed left-0 top-0 bottom-0 w-64 border-r z-50 ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
