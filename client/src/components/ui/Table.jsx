'use client';

/**
 * =============================================================================
 * Table.jsx — Data Table with Glassmorphism Styling
 * =============================================================================
 *
 * A responsive data table wrapped in a glass card. Supports dynamic column
 * definitions, custom cell renderers, a loading skeleton, and an empty state.
 *
 * Props:
 *   columns      – Array of { key, label, render? }
 *                   `key`   : property name to extract from each row
 *                   `label` : column header text
 *                   `render`: optional (value, row) => JSX custom renderer
 *   data         – Array of row objects
 *   loading      – Boolean, shows a skeleton instead of rows
 *   emptyMessage – String shown when data is empty and not loading
 *
 * Features:
 *   • Alternating semi-transparent row backgrounds
 *   • Horizontal scroll on mobile via overflow-x-auto
 *   • Skeleton shimmer for loading state
 * =============================================================================
 */

import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';

export default function Table({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No data available',
}) {
  return (
    <div
      className="
        backdrop-blur-xl bg-white dark:bg-white/5
        border border-gray-200 dark:border-white/10
        rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/20
        overflow-hidden
      "
    >
      {/* ── Scrollable wrapper for mobile responsiveness ──────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* ── Table header ──────────────────────────────────────────── */}
          <thead>
            <tr className="border-b border-gray-100 dark:border-white/10">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="
                    px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider
                    text-slate-500 dark:text-slate-400
                    bg-gray-50/50 dark:bg-white/[0.02]
                  "
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* ── Table body ────────────────────────────────────────────── */}
          <tbody>
            {/* ── Loading skeleton rows ────────────────────────────────── */}
            {loading &&
              Array.from({ length: 5 }).map((_, rowIdx) => (
                <tr
                  key={`skeleton-${rowIdx}`}
                  className="border-b border-gray-50 dark:border-white/5"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-3.5">
                      <div
                        className="
                          h-4 rounded-md
                          bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200
                          dark:from-white/10 dark:via-white/5 dark:to-white/10
                          bg-[length:200%_100%] animate-shimmer
                        "
                      />
                    </td>
                  ))}
                </tr>
              ))}

            {/* ── Data rows ───────────────────────────────────────────── */}
            {!loading &&
              data.map((row, rowIdx) => (
                <motion.tr
                  key={row.id || row._id || rowIdx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: rowIdx * 0.03 }}
                  className={`
                    border-b border-gray-50 dark:border-white/5
                    transition-colors duration-150
                    hover:bg-gray-50 dark:hover:bg-white/[0.03]
                    ${rowIdx % 2 === 1 ? 'bg-gray-50/30 dark:bg-white/[0.02]' : ''}
                  `}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-5 py-3.5 text-slate-700 dark:text-slate-300 whitespace-nowrap"
                    >
                      {/* Use custom renderer if provided, otherwise show raw value */}
                      {col.render
                        ? col.render(row[col.key], row)
                        : row[col.key]}
                    </td>
                  ))}
                </motion.tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* ── Empty state ─────────────────────────────────────────────── */}
      {!loading && data.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <Inbox size={40} className="mb-3 opacity-40" />
          <p className="text-sm">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}
