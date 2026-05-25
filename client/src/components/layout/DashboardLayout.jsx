'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Menu, Bell, Search, Sun, Moon, ChevronDown, LogOut, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Sidebar from './Sidebar';
import api from '@/lib/api';

export default function DashboardLayout({ children, role = 'student' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    // Fetch unread notification count
    if (isAuthenticated) {
      api.get('/notifications/unread-count')
        .then(r => setNotifications(r.data?.data?.count || 0))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    return parts.length === 1 ? parts[0][0].toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role={role}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className={`h-16 backdrop-blur-xl border-b flex items-center gap-4 px-4 lg:px-6 z-20 flex-shrink-0 transition-colors duration-300 ${isDark ? 'bg-slate-900/95 border-white/10' : 'bg-white/95 border-slate-200 shadow-sm'}`}>
          {/* Mobile menu toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className={`flex-1 max-w-md hidden sm:flex items-center gap-2 border rounded-xl px-3 py-2 transition-colors ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
            <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search courses, tests..."
              className={`bg-transparent text-sm placeholder-slate-400 outline-none w-full ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Theme toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className={`p-2 rounded-xl transition-colors ${isDark ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.button>

            {/* Notifications */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => router.push('/notifications')}
              className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center">
                  {notifications > 9 ? '9+' : notifications}
                </span>
              )}
            </motion.button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={`flex items-center gap-2 p-1.5 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                  {getInitials(user?.name)}
                </div>
                <span className={`text-sm hidden md:block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{user?.name?.split(' ')[0]}</span>
                <ChevronDown className={`w-3 h-3 hidden md:block ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
              </button>

              {userMenuOpen && (
                <div className={`absolute right-0 top-full mt-2 w-48 border rounded-xl shadow-xl z-50 overflow-hidden ${isDark ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-200'}`}>
                  <button
                    onClick={() => { router.push('/profile'); setUserMenuOpen(false); }}
                    className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors ${isDark ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    <User className="w-4 h-4" /> Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={`flex-1 overflow-y-auto transition-colors duration-300 ${isDark ? '' : 'text-slate-800'}`}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-4 lg:p-6"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
