/**
 * =============================================================================
 * Toast.jsx — Custom Toast Notification Helper
 * =============================================================================
 *
 * A thin wrapper around `react-hot-toast` that applies the portal's
 * dark-glassmorphism styling to every toast. Import `showToast` wherever
 * you need to trigger a notification.
 *
 * Usage:
 *   import { showToast } from '@/components/ui/Toast';
 *
 *   showToast.success('Profile updated!');
 *   showToast.error('Something went wrong');
 *   showToast.info('New quiz available');
 *
 * The module also exports a <ToastProvider /> component that should be
 * rendered once in the root layout to mount the react-hot-toast <Toaster />.
 * =============================================================================
 */

'use client';

import toast, { Toaster } from 'react-hot-toast';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

/* ── Shared style object for the dark glass look ───────────────────────────── */
const baseStyle = {
  background: 'rgba(15, 23, 42, 0.9)',  /* slate-900 @ 90% opacity */
  backdropFilter: 'blur(16px)',
  color: '#f1f5f9',                       /* slate-100 */
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '14px',
  padding: '12px 16px',
  fontSize: '14px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
};

/**
 * showToast — The main export.
 * Three methods: .success(), .error(), .info()
 */
export const showToast = {
  /** Green success toast */
  success: (message) =>
    toast.success(message, {
      style: baseStyle,
      iconTheme: { primary: '#34d399', secondary: '#0f172a' },
      duration: 3000,
    }),

  /** Red error toast */
  error: (message) =>
    toast.error(message, {
      style: baseStyle,
      iconTheme: { primary: '#f87171', secondary: '#0f172a' },
      duration: 4000,
    }),

  /** Cyan informational toast */
  info: (message) =>
    toast(message, {
      style: baseStyle,
      icon: <Info size={18} className="text-cyan-400" />,
      duration: 3000,
    }),
};

/**
 * ToastProvider — Renders the react-hot-toast <Toaster /> container.
 * Place this ONCE in your root layout so toasts can appear anywhere.
 *
 * Example (in layout.js):
 *   import { ToastProvider } from '@/components/ui/Toast';
 *   <ToastProvider />
 */
export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: baseStyle,
        duration: 3000,
      }}
      /* Slight gap between stacked toasts */
      gutter={10}
    />
  );
}
