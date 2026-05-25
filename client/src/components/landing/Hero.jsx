'use client';

/**
 * Hero.jsx — Full-viewport Hero Section
 * ======================================
 * • Animated gradient background (purple → indigo → cyan)
 * • Floating geometric shapes powered by Framer Motion
 * • Large heading with gradient text
 * • Two CTA buttons: "Get Started Free" (solid gradient) + "Explore Courses" (glass)
 * • Animated stats bar: Students, Courses, Placement Rate, Companies
 */

import { motion } from 'framer-motion';
import { ArrowRight, Play, Users, BookOpen, TrendingUp, Building2 } from 'lucide-react';
import Link from 'next/link';

/* ── Stats data ──────────────────────────────────────────── */
const stats = [
  { icon: Users, value: '10,000+', label: 'Students' },
  { icon: BookOpen, value: '500+', label: 'Courses' },
  { icon: TrendingUp, value: '95%', label: 'Placement Rate' },
  { icon: Building2, value: '50+', label: 'Companies' },
];

/* ── Floating shape config ───────────────────────────────── */
const floatingShapes = [
  { size: 72, x: '10%', y: '20%', delay: 0, duration: 6, color: 'bg-indigo-500/10' },
  { size: 48, x: '80%', y: '15%', delay: 1, duration: 7, color: 'bg-purple-500/10' },
  { size: 96, x: '70%', y: '60%', delay: 2, duration: 8, color: 'bg-cyan-500/10' },
  { size: 56, x: '15%', y: '70%', delay: 0.5, duration: 9, color: 'bg-violet-500/10' },
  { size: 40, x: '50%', y: '80%', delay: 1.5, duration: 6, color: 'bg-indigo-400/10' },
  { size: 64, x: '90%', y: '40%', delay: 3, duration: 7, color: 'bg-pink-500/10' },
];

/* ── Framer Motion variants ─────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export default function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950"
    >
      {/* ── Animated gradient background ────────────────── */}
      <div className="absolute inset-0">
        {/* Large radial blobs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[140px]" />
      </div>

      {/* ── Floating geometric shapes ───────────────────── */}
      {floatingShapes.map((shape, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-2xl ${shape.color} backdrop-blur-sm border border-white/5`}
          style={{
            width: shape.size,
            height: shape.size,
            left: shape.x,
            top: shape.y,
          }}
          animate={{
            y: [0, -30, 0],
            rotate: [0, 180, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: shape.duration,
            delay: shape.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* ── Grid pattern overlay ────────────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* ── Content ────────────────────────────────────── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center pt-24 pb-16"
      >
        {/* Badge */}
        <motion.div variants={itemVariants} className="mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium
            bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 backdrop-blur-sm">
            🚀 AI-Powered Learning Platform
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          variants={itemVariants}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight"
        >
          <span className="text-white">Accelerate Your </span>
          <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Learning Journey
          </span>
          <br className="hidden sm:block" />
          <span className="text-white">with </span>
          <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            AI
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          variants={itemVariants}
          className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
        >
          Master coding, ace interviews, and land your dream placement with our
          intelligent platform — AI-driven mock interviews, smart resume
          analysis, adaptive quizzes, and a personalised career roadmap.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          variants={itemVariants}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {/* Primary CTA */}
          <Link
            href="/register"
            className="group relative inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-white
              rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500
              shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Secondary CTA (glass) */}
          <a
            href="#courses"
            className="group inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-white
              rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm
              hover:bg-white/10 hover:border-white/20 transition-all duration-300"
          >
            <Play className="w-4 h-4 text-indigo-400" />
            Explore Courses
          </a>
        </motion.div>

        {/* ── Stats bar ──────────────────────────────────── */}
        <motion.div
          variants={itemVariants}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-white/5 backdrop-blur-sm
                border border-white/5 hover:border-indigo-500/30 transition-all duration-300"
            >
              <stat.icon className="w-5 h-5 text-indigo-400" />
              <span className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</span>
              <span className="text-xs text-slate-400">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
