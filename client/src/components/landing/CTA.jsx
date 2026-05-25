'use client';

/**
 * CTA.jsx — Call-To-Action Section
 * =================================
 * • Full width gradient background (indigo → purple)
 * • Heading: "Ready to Start Your Journey?"
 * • Email input + "Join Now" button
 * • Decorative background circles
 * • Framer Motion entrance animations
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CTA() {
  const [email, setEmail] = useState('');

  /* Simple client-side handler — connects to backend later */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    toast.success('Welcome aboard! Check your inbox 🎉');
    setEmail('');
  };

  return (
    <section className="relative py-24 overflow-hidden">
      {/* ── Gradient background ─────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700" />

      {/* Decorative circles */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/[0.03] rounded-full" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* ── Content ────────────────────────────────────── */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full
            bg-white/10 backdrop-blur-sm text-white/90 text-xs font-medium border border-white/20"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Free to get started
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight"
        >
          Ready to Start Your{' '}
          <span className="underline decoration-white/30 underline-offset-4">Journey</span>?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-white/70 max-w-lg mx-auto"
        >
          Join thousands of students already accelerating their careers with AI-powered learning.
          No credit card required.
        </motion.p>

        {/* ── Email form ───────────────────────────────── */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="flex-1 w-full px-5 py-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20
              text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30
              transition-all duration-200 text-sm"
          />
          <button
            type="submit"
            className="group w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white text-indigo-700 font-semibold text-sm
              hover:bg-white/90 shadow-xl shadow-black/10 transition-all duration-200
              flex items-center justify-center gap-2"
          >
            Join Now
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.form>

        {/* Trust note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-5 text-xs text-white/40"
        >
          ✦ No spam. Unsubscribe anytime. We respect your privacy.
        </motion.p>
      </div>
    </section>
  );
}
