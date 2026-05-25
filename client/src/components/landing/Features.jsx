'use client';

/**
 * Features.jsx — Feature Cards Grid Section
 * ==========================================
 * • Section title with gradient text
 * • 6 feature cards: glass effect, icon with gradient background
 * • 2×3 grid on desktop, 1 column on mobile
 * • Stagger animation triggered on scroll via Framer Motion useInView
 */

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Brain,
  FileText,
  ClipboardCheck,
  BarChart3,
  Map,
  MessageSquare,
} from 'lucide-react';

/* ── Feature data ────────────────────────────────────────── */
const features = [
  {
    icon: Brain,
    title: 'AI Interview Prep',
    description:
      'Practice with our AI interviewer that adapts difficulty in real-time, gives instant feedback, and tracks your improvement across sessions.',
    gradient: 'from-indigo-500 to-purple-600',
  },
  {
    icon: FileText,
    title: 'Smart Resume Analyzer',
    description:
      'Upload your resume and get an AI-powered score, keyword analysis, formatting tips, and ATS compatibility report in seconds.',
    gradient: 'from-purple-500 to-pink-600',
  },
  {
    icon: ClipboardCheck,
    title: 'Mock Tests & Quizzes',
    description:
      'Timed, adaptive quizzes covering aptitude, DSA, web development, and more. Detailed solutions and performance analytics included.',
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    icon: BarChart3,
    title: 'Performance Analytics',
    description:
      'Beautiful dashboards with Recharts-powered visualisations — track progress, identify weak areas, and benchmark against peers.',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Map,
    title: 'Career Roadmap',
    description:
      'Get a personalised, AI-generated career roadmap based on your skills, goals, and target companies with milestones and deadlines.',
    gradient: 'from-orange-500 to-amber-600',
  },
  {
    icon: MessageSquare,
    title: 'AI Chat Assistant',
    description:
      'An always-available AI tutor that answers doubts, explains concepts, generates practice problems, and guides your learning journey.',
    gradient: 'from-rose-500 to-red-600',
  },
];

/* ── Framer Motion variants ─────────────────────────────── */
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function Features() {
  /* Ref + inView for scroll-triggered stagger */
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section id="features" className="relative py-24 bg-slate-950 overflow-hidden">
      {/* Background accent blobs */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-purple-600/10 rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Section header ───────────────────────────── */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-xs font-medium text-indigo-400 tracking-widest uppercase mb-3"
          >
            Features
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white"
          >
            Powerful Features for{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Your Success
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-slate-400 max-w-2xl mx-auto"
          >
            Everything you need to learn, prepare, and land your dream placement — powered by
            cutting-edge artificial intelligence.
          </motion.p>
        </div>

        {/* ── Feature cards grid ──────────────────────── */}
        <motion.div
          ref={sectionRef}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              className="group relative p-6 rounded-2xl bg-white/[0.03] backdrop-blur-sm
                border border-white/5 hover:border-indigo-500/30
                hover:bg-white/[0.06] transition-all duration-300 cursor-default"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5
                opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              {/* Icon */}
              <div className={`relative z-10 inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient}
                shadow-lg shadow-indigo-500/10 mb-5`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>

              {/* Text */}
              <h3 className="relative z-10 text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="relative z-10 text-sm text-slate-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
