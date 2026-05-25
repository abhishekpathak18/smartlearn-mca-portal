'use client';

/**
 * Stats.jsx — Animated Counter Section
 * =====================================
 * • 4 stat items displayed in a horizontal row
 * • Each number counts up from 0 when scrolled into view
 * • Glass card backgrounds with subtle gradient borders
 * • Custom useCountUp hook drives the animation
 */

import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Users, BookOpen, Award, Building2 } from 'lucide-react';

/* ── Stats data ──────────────────────────────────────────── */
const statsData = [
  { icon: Users, value: 10000, suffix: '+', label: 'Active Students', color: 'text-indigo-400' },
  { icon: BookOpen, value: 500, suffix: '+', label: 'Expert Courses', color: 'text-cyan-400' },
  { icon: Award, value: 95, suffix: '%', label: 'Placement Rate', color: 'text-emerald-400' },
  { icon: Building2, value: 50, suffix: '+', label: 'Partner Companies', color: 'text-purple-400' },
];

/* ── Count-up hook ───────────────────────────────────────── */
function useCountUp(target, start, duration = 2000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return; // don't animate until triggered

    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // ease-out cubic for a natural feel
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [start, target, duration]);

  return count;
}

/* ── Single stat card ────────────────────────────────────── */
function StatCard({ icon: Icon, value, suffix, label, color, started }) {
  const animatedValue = useCountUp(value, started);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative group flex flex-col items-center gap-3 p-8 rounded-2xl
        bg-white/[0.03] backdrop-blur-sm border border-white/5
        hover:border-indigo-500/20 transition-all duration-300"
    >
      {/* Glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5
        opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <Icon className={`w-8 h-8 ${color} relative z-10`} />
      <span className="text-4xl sm:text-5xl font-extrabold text-white relative z-10">
        {animatedValue.toLocaleString()}
        {suffix}
      </span>
      <span className="text-sm text-slate-400 relative z-10">{label}</span>
    </motion.div>
  );
}

export default function Stats() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="relative py-24 bg-slate-950 overflow-hidden">
      {/* background blob */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[300px] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      <div ref={ref} className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section title */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-extrabold text-white"
          >
            Trusted by{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Thousands
            </span>
          </motion.h2>
        </div>

        {/* Cards row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {statsData.map((stat) => (
            <StatCard key={stat.label} {...stat} started={isInView} />
          ))}
        </div>
      </div>
    </section>
  );
}
