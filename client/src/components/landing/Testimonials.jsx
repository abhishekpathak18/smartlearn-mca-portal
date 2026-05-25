'use client';

/**
 * Testimonials.jsx — Student Testimonial Cards
 * =============================================
 * • Section title "What Students Say"
 * • 3 testimonial cards with avatar, name, role, quote, star rating
 * • Glass card design matching overall theme
 * • Stagger-on-scroll animation via Framer Motion
 */

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

/* ── Testimonial data ────────────────────────────────────── */
const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'Placed at Google',
    avatar: 'PS',
    color: 'from-indigo-500 to-purple-600',
    rating: 5,
    quote:
      'SmartLearn\'s AI interview prep was a game-changer. The adaptive questioning and real-time feedback helped me crack multiple FAANG interviews. Absolutely worth it!',
  },
  {
    name: 'Rahul Mehta',
    role: 'Placed at Microsoft',
    avatar: 'RM',
    color: 'from-cyan-500 to-blue-600',
    rating: 5,
    quote:
      'The mock tests are incredibly well-designed — they closely mimic actual placement exams. The analytics dashboard showed exactly where I needed to improve.',
  },
  {
    name: 'Ananya Iyer',
    role: 'Placed at Amazon',
    avatar: 'AI',
    color: 'from-emerald-500 to-teal-600',
    rating: 5,
    quote:
      'The resume analyser gave me actionable insights I never got from career counsellors. Within a week, my ATS score jumped from 45% to 92%. Highly recommended!',
  },
];

/* ── Variants ────────────────────────────────────────────── */
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="about" className="relative py-24 bg-slate-950 overflow-hidden">
      {/* blobs */}
      <div className="absolute top-0 left-1/3 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[350px] h-[350px] bg-indigo-600/10 rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Section header ───────────────────────────── */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-xs font-medium text-indigo-400 tracking-widest uppercase mb-3"
          >
            Testimonials
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white"
          >
            What Students{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Say
            </span>
          </motion.h2>
        </div>

        {/* ── Cards grid ──────────────────────────────── */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={cardVariants}
              className="group relative p-6 rounded-2xl bg-white/[0.03] backdrop-blur-sm
                border border-white/5 hover:border-indigo-500/30
                hover:bg-white/[0.06] transition-all duration-300"
            >
              {/* Quote icon */}
              <Quote className="w-8 h-8 text-indigo-500/20 mb-4" />

              {/* Quote text */}
              <p className="text-slate-300 text-sm leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>

              {/* Star rating */}
              <div className="flex gap-1 mb-5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Author */}
              <div className="flex items-center gap-3">
                {/* Avatar circle with initials */}
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color}
                  flex items-center justify-center text-sm font-bold text-white shadow-lg`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
