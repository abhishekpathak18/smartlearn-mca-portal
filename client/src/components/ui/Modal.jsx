'use client';

/**
 * =============================================================================
 * Modal.jsx — Animated Modal Dialog
 * =============================================================================
 *
 * A full-featured modal overlay using Framer Motion AnimatePresence for smooth
 * enter/exit animations. The backdrop has a blur effect and clicking outside or
 * pressing Escape closes the modal.
 *
 * Props:
 *   isOpen   – Boolean controlling visibility
 *   onClose  – Callback fired when the user attempts to close
 *   title    – Optional heading text at the top of the modal
 *   children – Modal body content
 *   size     – 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
 *
 * Interaction:
 *   • Click outside the modal content → closes
 *   • Press Escape key              → closes
 *   • X button in top-right         → closes
 * =============================================================================
 */

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/* ── Width presets for different modal sizes ────────────────────────────────── */
const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/* ── Animation variants ────────────────────────────────────────────────────── */
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) {
  /* ── Escape key handler ──────────────────────────────────────────────── */
  const handleEscape = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      /* Prevent background scroll while modal is open */
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  return (
    <AnimatePresence>
      {isOpen && (
        /* ── Backdrop overlay ──────────────────────────────────────────── */
        <motion.div
          key="modal-backdrop"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.2 }}
          onClick={onClose}          /* Click outside to close */
          className="
            fixed inset-0 z-50 flex items-center justify-center p-4
            bg-black/60 backdrop-blur-sm
          "
        >
          {/* ── Modal content card ─────────────────────────────────────── */}
          <motion.div
            key="modal-content"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()} /* Prevent close on inner click */
            className={`
              w-full ${sizeMap[size] || sizeMap.md}
              backdrop-blur-xl
              bg-white dark:bg-slate-900/95
              border border-gray-200 dark:border-white/10
              rounded-2xl shadow-2xl shadow-black/20
              overflow-hidden
            `}
          >
            {/* ── Header (title + close button) ────────────────────────── */}
            {title && (
              <div className="
                flex items-center justify-between px-6 py-4
                border-b border-gray-100 dark:border-white/10
              ">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="
                    p-1.5 rounded-lg
                    text-slate-400 hover:text-slate-600 dark:hover:text-white
                    hover:bg-gray-100 dark:hover:bg-white/10
                    transition-colors duration-200
                  "
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* ── Close button when there is no title ──────────────────── */}
            {!title && (
              <button
                onClick={onClose}
                className="
                  absolute top-3 right-3 p-1.5 rounded-lg z-10
                  text-slate-400 hover:text-slate-600 dark:hover:text-white
                  hover:bg-gray-100 dark:hover:bg-white/10
                  transition-colors duration-200
                "
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            )}

            {/* ── Body ─────────────────────────────────────────────────── */}
            <div className="px-6 py-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
