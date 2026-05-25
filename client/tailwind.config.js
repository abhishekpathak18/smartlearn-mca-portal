/**
 * =============================================================================
 * SmartLearn – Tailwind CSS Configuration
 * =============================================================================
 * This config extends the default Tailwind theme with:
 *
 *  1. Font families  – Inter (body/UI) & Outfit (headings/display)
 *  2. Custom colours – primary (indigo) & accent (cyan/teal) palettes
 *  3. Animations     – float, pulse-glow, shimmer, slide-up, fade-in
 *  4. Keyframes      – matching definitions for the above animations
 *  5. Background imgs – reusable gradient definitions
 *  6. Dark mode       – class-based toggling ('dark' class on <html>)
 *
 * The content array ensures Tailwind can tree-shake unused utilities
 * from every file under src/.
 * =============================================================================
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  /* --- Class-based dark mode ------------------------------------------------
     We toggle a 'dark' class on <html> from ThemeContext so that dark:
     variants are activated programmatically (instead of relying on the
     OS-level prefers-color-scheme media query alone). */
  darkMode: 'class',

  /* --- Content paths --------------------------------------------------------
     Tailwind scans these globs at build time to find which utility classes
     are actually used so it can purge the rest for a small CSS bundle. */
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/context/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    extend: {
      /* --- Font Families ---------------------------------------------------
         "sans" overrides the default Tailwind sans stack so every element
         using font-sans (or the body) gets Inter automatically.
         "display" is an extra family for headings via font-display. */
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },

      /* --- Custom Colour Palettes ------------------------------------------
         "primary" maps to indigo shades used across buttons, links, accents.
         "accent" maps to cyan/teal shades used for highlights & badges.
         Each palette includes shades 50–950 for maximum flexibility. */
      colors: {
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',   // base indigo
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        accent: {
          50:  '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',   // bright cyan
          500: '#06b6d4',   // base cyan
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
      },

      /* --- Custom Animations -----------------------------------------------
         Each animation name maps to a shorthand that references the
         keyframes defined below. Durations & easing can be tweaked here. */
      animation: {
        'float':       'float 6s ease-in-out infinite',
        'pulse-glow':  'pulse-glow 3s ease-in-out infinite',
        'shimmer':     'shimmer 2s linear infinite',
        'slide-up':    'slide-up 0.6s ease-out forwards',
        'fade-in':     'fade-in 0.5s ease-out forwards',
      },

      /* --- Keyframes -------------------------------------------------------
         Defines the actual animation steps. These must match the names
         referenced in the "animation" map above. */
      keyframes: {
        /* Gentle vertical bob — hero illustrations & decorative blobs */
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-20px)' },
        },
        /* Glow intensity breathing — cards & focus rings */
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 15px rgba(139, 92, 246, 0.35)' },
          '50%':      { boxShadow: '0 0 30px rgba(139, 92, 246, 0.5), 0 0 60px rgba(139, 92, 246, 0.2)' },
        },
        /* Left-to-right shine sweep — skeleton loading placeholders */
        shimmer: {
          '0%':   { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        /* Slide up with fade — page section entry animations */
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        /* Simple opacity fade — overlay & modal entrances */
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },

      /* --- Background Images (Gradients) -----------------------------------
         Reusable gradient definitions accessible via bg-gradient-primary etc. */
      backgroundImage: {
        'gradient-primary':  'linear-gradient(to right, #4f46e5, #7c3aed)',
        'gradient-accent':   'linear-gradient(to right, #06b6d4, #14b8a6)',
        'gradient-dark':     'linear-gradient(to bottom right, #0f172a, rgba(88,28,135,0.2), #0f172a)',
        'gradient-radial':   'radial-gradient(ellipse at center, rgba(99,102,241,0.15), transparent 70%)',
        'gradient-conic':    'conic-gradient(from 180deg at 50% 50%, #6366f1, #8b5cf6, #22d3ee, #6366f1)',
      },

      /* --- Additional Spacing / Sizing (optional) --- */
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },

  /* --- Plugins ---------------------------------------------------------------
     No external plugins are required; our design system is self-contained. */
  plugins: [],
};
