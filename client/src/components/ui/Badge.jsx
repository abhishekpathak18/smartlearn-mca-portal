'use client';

/**
 * =============================================================================
 * Badge.jsx — Coloured Status Badge / Pill
 * =============================================================================
 *
 * A small pill-shaped badge used to indicate status, category, or tag.
 * Comes in five colour variants with matching text and background.
 *
 * Props:
 *   children  – Badge label text
 *   variant   – 'default' | 'success' | 'warning' | 'danger' | 'info' (default: 'default')
 *   size      – 'sm' | 'md' (default: 'md')
 *   className – Extra Tailwind classes
 *
 * Example:
 *   <Badge variant="success">Active</Badge>
 * =============================================================================
 */

/* ── Colour presets per variant ─────────────────────────────────────────────── */
const variantStyles = {
  default: 'bg-slate-500/10 text-slate-300 dark:text-slate-300 border-slate-500/20',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  danger:  'bg-red-500/10 text-red-400 border-red-500/20',
  info:    'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

/* ── Size presets ───────────────────────────────────────────────────────────── */
const sizeStyles = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) {
  return (
    <span
      className={`
        inline-flex items-center font-medium
        rounded-full border
        ${variantStyles[variant] || variantStyles.default}
        ${sizeStyles[size] || sizeStyles.md}
        ${className}
      `}
    >
      {/* Small coloured dot before the label */}
      <span
        className={`
          w-1.5 h-1.5 rounded-full mr-1.5
          ${variant === 'success' ? 'bg-emerald-400' : ''}
          ${variant === 'warning' ? 'bg-amber-400' : ''}
          ${variant === 'danger'  ? 'bg-red-400'    : ''}
          ${variant === 'info'    ? 'bg-cyan-400'   : ''}
          ${variant === 'default' ? 'bg-slate-400'  : ''}
        `}
      />
      {children}
    </span>
  );
}
