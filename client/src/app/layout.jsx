/**
 * =============================================================================
 * Root Layout – SmartLearn Portal
 * =============================================================================
 * This is the top-level layout in the Next.js 14 App Router. It:
 *
 *  1. Defines global metadata (title, description, keywords, etc.)
 *  2. Loads Google Fonts via <link> tags in <head>
 *  3. Imports the global stylesheet (globals.css)
 *  4. Wraps the entire app with ThemeProvider (dark/light toggle) and
 *     AuthProvider (user authentication state)
 *  5. Renders a Toaster for react-hot-toast notifications
 *
 * Because this file ONLY provides static metadata and renders providers
 * (which are client components themselves), the layout itself remains a
 * Server Component — no 'use client' directive needed here.
 * =============================================================================
 */

/* --- Global CSS (Tailwind + custom design system) --- */
import './globals.css';

/* --- Context Providers --- */
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';

/* --- Toast Notifications --- */
import { Toaster } from 'react-hot-toast';

/* =============================================================================
   Metadata
   =============================================================================
   Next.js 14 uses this exported object to populate <head> tags automatically.
   - title:       Browser tab title & SEO
   - description:  Meta description for search engines
   - keywords:     Comma-separated keywords for discoverability             */
export const metadata = {
  title: 'SmartLearn - AI Powered Learning & Placement Portal',
  description:
    'An AI-powered smart learning and placement preparation portal offering personalised courses, adaptive tests, interview preparation, and real-time analytics to help students ace their placements.',
  keywords: [
    'AI learning',
    'placement preparation',
    'smart learning portal',
    'online courses',
    'interview prep',
    'adaptive testing',
    'MCA project',
    'Next.js',
  ],
  /* Favicon & app icons (uses the default /app/favicon.ico) */
  icons: {
    icon: '/favicon.ico',
  },
};

/* =============================================================================
   RootLayout Component
   =============================================================================
   Wraps every page in the application. The <html> tag gets lang="en" and the
   "dark" class by default (dark-theme-first design). ThemeProvider will
   toggle this class at runtime based on user preference. */
export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      {/* ---------------------------------------------------------------
          <head> — Google Fonts
          We load Inter and Outfit via <link> tags for maximum browser
          compatibility. The fonts are also declared in globals.css via
          @import, but having link tags here ensures faster discovery
          by the browser's preload scanner.
          --------------------------------------------------------------- */}
      <head>
        {/* Preconnect to Google Fonts servers for faster font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Load Inter (400–700) and Outfit (600–800) font families */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>

      {/* ---------------------------------------------------------------
          <body>
          - font-sans:          Uses Inter (set in tailwind.config.js)
          - antialiased:        Smoother font rendering
          - bg-slate-900:       Dark background fallback
          - text-slate-100:     Light text fallback
          - transition-colors:  Smooth bg/text transitions on theme switch
          --------------------------------------------------------------- */}
      <body className="font-sans antialiased bg-slate-900 text-slate-100 transition-colors duration-300">
        {/* --- Theme Provider (dark / light mode context) --- */}
        <ThemeProvider>
          {/* --- Auth Provider (user session & authentication) --- */}
          <AuthProvider>
            {/* Render child pages / nested layouts */}
            {children}

            {/* -------------------------------------------------------
                Toast Notification Container
                Positioned top-right with dark-themed styling to match
                the portal design. Toasts auto-dismiss after 4 seconds.
                ------------------------------------------------------- */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1e293b',     /* slate-800 */
                  color: '#f1f5f9',          /* slate-100 */
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  backdropFilter: 'blur(12px)',
                },
                /* Success toast — green accent */
                success: {
                  iconTheme: {
                    primary: '#22c55e',       /* green-500 */
                    secondary: '#f1f5f9',
                  },
                },
                /* Error toast — red accent */
                error: {
                  iconTheme: {
                    primary: '#ef4444',       /* red-500 */
                    secondary: '#f1f5f9',
                  },
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
