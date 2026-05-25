'use client';

/**
 * =============================================================================
 * Skeleton.jsx — Shimmer Loading Placeholder
 * =============================================================================
 *
 * Renders a pulsing / shimmer placeholder while content is loading.
 * Supports multiple shape presets to match the layout being loaded.
 *
 * Props:
 *   type      – 'text' | 'card' | 'avatar' | 'chart' (default: 'text')
 *   count     – Number of skeleton elements to render (default: 1)
 *   className – Extra Tailwind classes
 *
 * The shimmer effect uses a CSS gradient that slides left-to-right continuously,
 * driven by the `animate-shimmer` utility defined in tailwind.config.js.
 * =============================================================================
 */

/* ── Shared shimmer gradient classes ───────────────────────────────────────── */
const shimmerBase = `
  bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200
  dark:from-white/10 dark:via-white/5 dark:to-white/10
  bg-[length:200%_100%] animate-shimmer
`;

/* ── Per-type shape / size presets ──────────────────────────────────────────── */
const typeStyles = {
  text: `h-4 rounded-md w-full ${shimmerBase}`,

  card: `h-40 rounded-2xl w-full ${shimmerBase}`,

  avatar: `h-12 w-12 rounded-full ${shimmerBase}`,

  chart: `h-64 rounded-2xl w-full ${shimmerBase}`,
};

export default function Skeleton({
  type = 'text',
  count = 1,
  className = '',
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => {
        /* For "text" type, vary widths to look like real lines of text */
        const widthVariation =
          type === 'text'
            ? i === count - 1
              ? 'w-2/3'        // Last line shorter
              : i % 3 === 1
                ? 'w-5/6'      // Some lines slightly shorter
                : 'w-full'
            : '';

        return (
          <div
            key={i}
            className={`
              ${typeStyles[type] || typeStyles.text}
              ${widthVariation}
              ${className}
            `}
          />
        );
      })}
    </div>
  );
}
