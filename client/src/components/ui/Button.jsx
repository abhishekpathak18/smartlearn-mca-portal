'use client';

/**
 * =============================================================================
 * Button.jsx — Premium Reusable Button Component
 * =============================================================================
 *
 * A highly customisable button that supports four visual variants, three sizes,
 * a loading state with spinner, an optional leading icon, and Framer Motion
 * micro-interactions (hover scale + tap shrink).
 *
 * Props:
 *   children   – Button label / content
 *   variant    – 'primary' | 'secondary' | 'danger' | 'ghost' (default: 'primary')
 *   size       – 'sm' | 'md' | 'lg' (default: 'md')
 *   loading    – Boolean, shows a spinner and disables the button
 *   disabled   – Boolean, dims the button and blocks interaction
 *   icon       – A Lucide React icon component (rendered before children)
 *   className  – Additional Tailwind classes to merge
 *   ...props   – Forwarded to the underlying <button> element
 *
 * Design:
 *   • Primary  → Indigo-to-Purple gradient with an animated glow on hover
 *   • Secondary→ Glassmorphism border with subtle background
 *   • Danger   → Red gradient (destructive actions)
 *   • Ghost    → Transparent, background only on hover
 * =============================================================================
 */

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/* ── Variant style map ─────────────────────────────────────────────────────── */
const variants = {
  primary: [
    'bg-gradient-to-r from-indigo-600 to-purple-600',
    'hover:shadow-lg hover:shadow-indigo-500/25',
    'text-white',
    'border border-indigo-500/20',
  ].join(' '),

  secondary: [
    'bg-white/5 dark:bg-white/5 bg-white',
    'backdrop-blur-sm',
    'border border-white/10 dark:border-white/10 border-gray-200',
    'text-slate-900 dark:text-white',
    'hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-50',
  ].join(' '),

  danger: [
    'bg-gradient-to-r from-red-600 to-rose-600',
    'hover:shadow-lg hover:shadow-red-500/25',
    'text-white',
    'border border-red-500/20',
  ].join(' '),

  ghost: [
    'bg-transparent',
    'text-slate-700 dark:text-slate-300',
    'hover:bg-white/10 dark:hover:bg-white/10 hover:bg-gray-100',
    'border border-transparent',
  ].join(' '),
};

/* ── Size style map ────────────────────────────────────────────────────────── */
const sizes = {
  sm: 'px-3 py-1.5 text-sm gap-1.5 rounded-lg',
  md: 'px-5 py-2.5 text-sm gap-2 rounded-xl',
  lg: 'px-7 py-3.5 text-base gap-2.5 rounded-xl',
};

/* ── Icon size map (matches button size) ───────────────────────────────────── */
const iconSizes = { sm: 14, md: 16, lg: 18 };

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  ...props
}) {
  /* Determine if the button should be non-interactive */
  const isDisabled = disabled || loading;

  return (
    <motion.button
      /* ── Framer Motion micro-interactions ─────────────────────────────── */
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.97 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}

      /* ── Tailwind classes ────────────────────────────────────────────── */
      className={`
        relative inline-flex items-center justify-center font-medium
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:ring-offset-2
        focus:ring-offset-transparent
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}

      disabled={isDisabled}
      {...props}
    >
      {/* ── Loading spinner (replaces icon when loading) ────────────── */}
      {loading ? (
        <Loader2
          size={iconSizes[size]}
          className="animate-spin"
          aria-hidden="true"
        />
      ) : Icon ? (
        /* ── Optional leading icon ──────────────────────────────────── */
        <Icon size={iconSizes[size]} aria-hidden="true" />
      ) : null}

      {/* ── Button label ───────────────────────────────────────────── */}
      {children}
    </motion.button>
  );
}
