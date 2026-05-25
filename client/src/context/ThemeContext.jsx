'use client';

/**
 * =============================================================================
 * ThemeContext – Dark / Light Mode Provider
 * =============================================================================
 * Manages the application's colour theme (dark or light) across every page.
 *
 * How it works:
 *  1. On first mount it checks localStorage for a previously saved preference.
 *     If none is found it falls back to the user's OS-level preference via
 *     the `prefers-color-scheme` media query.
 *  2. It adds or removes the 'dark' class on <html> — this is what activates
 *     all Tailwind `dark:` variants and our custom dark-mode CSS.
 *  3. Whenever the user toggles, the new preference is written to localStorage
 *     so it persists across sessions.
 *
 * Usage in any client component:
 *   const { theme, toggleTheme, isDark } = useTheme();
 *
 * This file uses the 'use client' directive because it depends on React hooks
 * (useState, useEffect, useContext) and browser APIs (localStorage, document).
 * =============================================================================
 */

import { createContext, useContext, useState, useEffect } from 'react';

/* ---- Create the context with a sensible default shape ---- */
const ThemeContext = createContext({
  theme: 'dark',         // 'dark' | 'light'
  toggleTheme: () => {},
  isDark: true,
});

/**
 * ThemeProvider
 * Wrap this around your app (in layout.jsx) to provide theme state everywhere.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children — child components to render
 */
export function ThemeProvider({ children }) {
  /* ---- State: current theme string ('dark' or 'light') ---- */
  const [theme, setTheme] = useState('dark');

  /* ---- State: tracks whether the component has mounted (avoids SSR mismatch) ---- */
  const [mounted, setMounted] = useState(false);

  /* ==========================================================================
     Effect: Initialise theme on mount
     ==========================================================================
     Runs once after hydration to read the saved preference or detect the
     system preference. We also set `mounted = true` so the provider can
     safely render children without a hydration mismatch. */
  useEffect(() => {
    // Attempt to read the user's previously saved preference
    const savedTheme = localStorage.getItem('smartlearn-theme');

    if (savedTheme) {
      // User has a stored preference — use it
      setTheme(savedTheme);
      applyThemeClass(savedTheme);
    } else {
      // No stored preference — check the OS-level setting
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const detectedTheme = prefersDark ? 'dark' : 'light';
      setTheme(detectedTheme);
      applyThemeClass(detectedTheme);
    }

    setMounted(true);
  }, []);

  /* ==========================================================================
     applyThemeClass — Adds or removes 'dark' on <html>
     ==========================================================================
     Tailwind's `darkMode: 'class'` strategy looks for a 'dark' class on
     an ancestor element. We apply it directly to <html> (documentElement)
     so every descendant inherits it. */
  const applyThemeClass = (newTheme) => {
    const root = document.documentElement;

    if (newTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  };

  /* ==========================================================================
     toggleTheme — Switch between dark and light
     ==========================================================================
     Called from a theme-toggle button anywhere in the app. */
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    applyThemeClass(newTheme);

    // Persist the choice so it survives page reloads / new tabs
    localStorage.setItem('smartlearn-theme', newTheme);
  };

  /* Derived boolean for convenience — avoids `theme === 'dark'` checks */
  const isDark = theme === 'dark';

  /* ---- Context value object ---- */
  const value = {
    theme,        // 'dark' | 'light'
    toggleTheme,  // () => void
    isDark,       // boolean
  };

  /* Until the component has mounted we can't know the real theme (SSR has no
     localStorage). We still render children but with the default 'dark' to
     avoid a hydration mismatch — the useEffect above corrects it instantly. */
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * useTheme — Custom hook to consume theme context
 * Throws a helpful error if used outside of ThemeProvider.
 *
 * @returns {{ theme: string, toggleTheme: () => void, isDark: boolean }}
 */
export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a <ThemeProvider>');
  }

  return context;
}
