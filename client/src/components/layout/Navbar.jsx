'use client';

/**
 * Navbar.jsx — PUBLIC Landing-page Navigation Bar
 * ================================================
 * • Fixed at top with glassmorphism (backdrop-blur + semi-transparent bg)
 * • Gradient logo with a GraduationCap icon
 * • Desktop nav links: Home, Features, Courses, About
 * • Right section: Login + Register (gradient) buttons
 * • Mobile: hamburger icon toggles a Framer-Motion slide-in drawer
 * • Becomes more opaque as the user scrolls down
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Menu, X } from 'lucide-react';

/* ── Navigation link data ──────────────────────────────────── */
const navLinks = [
  { name: 'Home', href: '#home' },
  { name: 'Features', href: '#features' },
  { name: 'Courses', href: '#courses' },
  { name: 'About', href: '#about' },
];

export default function Navbar() {
  /* scroll-Y tracking → controls background opacity */
  const [scrolled, setScrolled] = useState(false);
  /* mobile drawer open/closed */
  const [mobileOpen, setMobileOpen] = useState(false);

  /* ── Scroll listener ────────────────────────────────────── */
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* Close mobile menu on resize to desktop */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* ── Fixed top navbar ──────────────────────────────── */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
          ${scrolled
            ? 'bg-slate-900/95 shadow-lg shadow-indigo-500/5'
            : 'bg-slate-900/80'}
          backdrop-blur-xl border-b border-white/5`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18">

            {/* ── Logo ───────────────────────────────────── */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                SmartLearn
              </span>
            </Link>

            {/* ── Desktop nav links (hidden on mobile) ──── */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="relative px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg
                    transition-colors duration-200 group"
                >
                  {link.name}
                  {/* animated underline on hover */}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5
                    bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full
                    group-hover:w-3/4 transition-all duration-300" />
                </a>
              ))}
            </div>

            {/* ── Right section: CTA buttons + mobile hamburger */}
            <div className="flex items-center gap-3">
              {/* Login */}
              <Link
                href="/login"
                className="hidden md:inline-flex px-4 py-2 text-sm font-medium text-slate-300 hover:text-white
                  border border-white/10 rounded-lg hover:border-white/20 transition-all duration-200"
              >
                Login
              </Link>

              {/* Register (gradient) */}
              <Link
                href="/register"
                className="hidden md:inline-flex px-5 py-2 text-sm font-semibold text-white rounded-lg
                  bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500
                  shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200"
              >
                Register
              </Link>

              {/* Hamburger (mobile only) */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ── Mobile slide-in drawer ────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 z-50 w-72 h-full bg-slate-900/95 backdrop-blur-xl
                border-l border-white/10 shadow-2xl md:hidden flex flex-col"
            >
              {/* Close button */}
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Menu
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Links */}
              <div className="flex-1 px-4 py-6 space-y-1">
                {navLinks.map((link, i) => (
                  <motion.a
                    key={link.name}
                    href={link.href}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg
                      transition-colors duration-200 font-medium"
                  >
                    {link.name}
                  </motion.a>
                ))}
              </div>

              {/* Bottom CTA */}
              <div className="p-4 space-y-3 border-t border-white/5">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center px-4 py-2.5 text-sm font-medium text-slate-300
                    border border-white/10 rounded-lg hover:border-white/20 transition-all"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-white rounded-lg
                    bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500
                    shadow-lg shadow-indigo-500/25 transition-all"
                >
                  Register
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
