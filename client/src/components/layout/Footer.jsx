'use client';

/**
 * Footer.jsx — Glass-effect Landing Page Footer
 * ===============================================
 * • Gradient accent line at top
 * • 4-column responsive layout: About, Quick Links, Resources, Contact
 * • Social-media icon row at the bottom
 * • Copyright notice
 */

import Link from 'next/link';
import { GraduationCap, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';

// SVG social icons (lucide v1 removed brand icons)
const GithubIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);
const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
const LinkedinIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);
const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);


/* ── Column data ─────────────────────────────────────────── */
const quickLinks = [
  { name: 'Home', href: '/' },
  { name: 'About Us', href: '#about' },
  { name: 'Courses', href: '#courses' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'Contact', href: '#contact' },
];

const resources = [
  { name: 'Documentation', href: '#' },
  { name: 'Blog', href: '#' },
  { name: 'Career Tips', href: '#' },
  { name: 'Interview Guide', href: '#' },
  { name: 'FAQs', href: '#' },
];

const socialLinks = [
  { icon: GithubIcon, href: '#', label: 'GitHub' },
  { icon: TwitterIcon, href: '#', label: 'Twitter' },
  { icon: LinkedinIcon, href: '#', label: 'LinkedIn' },
  { icon: YoutubeIcon, href: '#', label: 'YouTube' },
];

export default function Footer() {
  return (
    <footer className="relative mt-20">
      {/* ── Gradient accent line at top ─────────────────── */}
      <div className="h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

      {/* ── Main footer body ───────────────────────────── */}
      <div className="bg-slate-900/80 backdrop-blur-xl border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

            {/* ── Column 1 — About ──────────────────────── */}
            <div>
              {/* Logo */}
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                  SmartLearn
                </span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                AI-powered smart learning &amp; placement preparation portal.
                Accelerate your career with intelligent mock interviews,
                resume analysis, and personalised roadmaps.
              </p>
            </div>

            {/* ── Column 2 — Quick Links ───────────────── */}
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-indigo-400 transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Column 3 — Resources ─────────────────── */}
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                {resources.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-indigo-400 transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Column 4 — Contact ───────────────────── */}
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm text-slate-400">
                  <Mail className="w-4 h-4 mt-0.5 text-indigo-400" />
                  support@smartlearn.io
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-400">
                  <Phone className="w-4 h-4 mt-0.5 text-indigo-400" />
                  +91 98765 43210
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-400">
                  <MapPin className="w-4 h-4 mt-0.5 text-indigo-400" />
                  MCA Department, University Campus
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Bottom bar — copyright + socials ─────────── */}
        <div className="border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              &copy; {new Date().getFullYear()} SmartLearn. All rights reserved.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                >
                  <s.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
