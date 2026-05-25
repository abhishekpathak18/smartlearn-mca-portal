'use client';

/**
 * =============================================================================
 * Input.jsx — Styled Form Input with Icon & Error State
 * =============================================================================
 *
 * A text input field that follows the glassmorphism dark/light design. Supports
 * an optional Lucide icon on the left, an animated label, and a clear error
 * message display.
 *
 * Props:
 *   label     – Input label text
 *   error     – Error message string (turns border red when truthy)
 *   icon      – A Lucide React icon component shown inside the input
 *   type      – HTML input type (default: 'text')
 *   className – Extra classes for the wrapper div
 *   ...props  – Forwarded to the native <input> element (value, onChange, etc.)
 *
 * Styling:
 *   Dark  → bg-white/5, border-white/10, focus:border-indigo-500
 *   Light → bg-gray-50, border-gray-200
 *   Error → red border + error text below the field
 * =============================================================================
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Input({
  label,
  error,
  icon: Icon,
  type = 'text',
  className = '',
  ...props
}) {
  /* Track focus state for animated label styling */
  const [isFocused, setIsFocused] = useState(false);

  /* Determine if the input currently has a value (for label positioning) */
  const hasValue = props.value !== undefined && props.value !== '';

  return (
    <div className={`relative w-full ${className}`}>
      {/* ── Label ──────────────────────────────────────────────────────── */}
      {label && (
        <label
          className={`
            block mb-1.5 text-sm font-medium transition-colors duration-200
            ${isFocused
              ? 'text-indigo-400'
              : 'text-slate-600 dark:text-slate-400'
            }
            ${error ? 'text-red-400' : ''}
          `}
        >
          {label}
        </label>
      )}

      {/* ── Input wrapper (positions icon + input together) ────────────── */}
      <div className="relative">
        {/* ── Leading icon ─────────────────────────────────────────────── */}
        {Icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Icon
              size={18}
              className={`
                transition-colors duration-200
                ${isFocused
                  ? 'text-indigo-400'
                  : 'text-slate-400 dark:text-slate-500'
                }
                ${error ? 'text-red-400' : ''}
              `}
            />
          </div>
        )}

        {/* ── Native <input> element ───────────────────────────────────── */}
        <input
          type={type}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);       // forward original handler if any
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={`
            w-full rounded-xl transition-all duration-200
            text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500

            /* ── Background & border ─────────────────────────────────── */
            bg-gray-50 dark:bg-white/5
            border
            ${error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-200 dark:border-white/10 focus:border-indigo-500 focus:ring-indigo-500/20'
            }

            /* ── Focus ring ──────────────────────────────────────────── */
            focus:outline-none focus:ring-2

            /* ── Padding (extra left when icon is present) ───────────── */
            ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5
          `}
          {...props}
        />
      </div>

      {/* ── Error message with enter/exit animation ───────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="mt-1.5 text-xs text-red-400 flex items-center gap-1"
          >
            {/* Small bullet dot before the error */}
            <span className="inline-block w-1 h-1 rounded-full bg-red-400" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
