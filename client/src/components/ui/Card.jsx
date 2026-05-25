'use client';

/**
 * =============================================================================
 * Card.jsx — Glassmorphism Card Component
 * =============================================================================
 *
 * A versatile card that uses backdrop-blur and semi-transparent backgrounds
 * to create the signature "glass" look. Optionally animates on hover with
 * Framer Motion (scale + indigo glow).
 *
 * Props:
 *   children  – Card content
 *   className – Additional Tailwind classes
 *   hover     – Boolean, enables scale-up + glow on hover (default: false)
 *   glow      – Boolean, shows a permanent subtle glow (default: false)
 *   padding   – 'none' | 'sm' | 'md' | 'lg' (default: 'md')
 * =============================================================================
 */

import { motion } from 'framer-motion';

/* ── Padding presets ───────────────────────────────────────────────────────── */
const paddingMap = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-8',
};

export default function Card({
  children,
  className = '',
  hover = false,
  glow = false,
  padding = 'md',
}) {
  return (
    <motion.div
      /* ── Hover animation (only when `hover` prop is true) ──────────── */
      whileHover={
        hover
          ? {
              scale: 1.02,
              boxShadow: '0 0 30px rgba(99, 102, 241, 0.15)',
            }
          : {}
      }
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}

      className={`
        /* ── Glass effect ─────────────────────────────────────────────── */
        backdrop-blur-xl
        bg-white dark:bg-white/5
        border border-gray-200 dark:border-white/10
        rounded-2xl
        shadow-lg shadow-black/5 dark:shadow-black/20

        /* ── Optional permanent glow ring ─────────────────────────────── */
        ${glow ? 'ring-1 ring-indigo-500/20 animate-glow' : ''}

        /* ── Padding ──────────────────────────────────────────────────── */
        ${paddingMap[padding] || paddingMap.md}

        /* ── Smooth transitions for non-motion properties ─────────────── */
        transition-colors duration-200

        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
