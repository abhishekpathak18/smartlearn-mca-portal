'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, BookOpen, Clock, Users, Star, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { truncateText } from '@/lib/utils';
import toast from 'react-hot-toast';

const CATEGORIES = ['all', 'programming', 'dsa', 'web-dev', 'database', 'ai-ml', 'aptitude', 'soft-skills'];
const LEVELS = ['all', 'beginner', 'intermediate', 'advanced'];

const CATEGORY_GRADIENTS = {
  programming: 'from-blue-500 to-cyan-500', dsa: 'from-purple-500 to-pink-500',
  'web-dev': 'from-orange-500 to-amber-500', database: 'from-green-500 to-emerald-500',
  'ai-ml': 'from-violet-500 to-purple-500', aptitude: 'from-red-500 to-rose-500',
  'soft-skills': 'from-teal-500 to-cyan-500',
};

function CourseCard({ course, onEnroll }) {
  const gradient = CATEGORY_GRADIENTS[course.category] || 'from-indigo-500 to-purple-500';
  const router = useRouter();
  return (
    <motion.div whileHover={{ y: -4 }} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all">
      {/* Thumbnail */}
      <div className={`h-36 bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
        <BookOpen className="w-12 h-12 text-white/50" />
        <span className="absolute top-3 right-3 bg-black/30 text-white text-xs px-2 py-1 rounded-full capitalize">{course.level}</span>
        <span className="absolute top-3 left-3 bg-black/30 text-white text-xs px-2 py-1 rounded-full capitalize">{course.category?.replace('-', ' ')}</span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-white text-sm mb-1 leading-snug">{course.title}</h3>
        <p className="text-xs text-slate-400 mb-3">{truncateText(course.description, 80)}</p>
        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration}</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.enrolledStudents?.length || 0}</span>
          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" />{course.rating?.toFixed(1)}</span>
        </div>
        <p className="text-xs text-slate-500 mb-3">By {course.instructor}</p>
        <div className="flex gap-2">
          <button onClick={() => router.push(`/courses/${course._id}`)} className="flex-1 py-2 rounded-xl bg-white/10 text-sm text-slate-300 hover:bg-white/15 transition-colors text-center">View</button>
          <button onClick={() => onEnroll(course._id)} className="flex-1 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-sm text-white hover:from-indigo-500 hover:to-purple-500 transition-all">Enroll</button>
        </div>
      </div>
    </motion.div>
  );
}

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [level, setLevel] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 9;

  useEffect(() => {
    const t = setTimeout(fetchCourses, 400);
    return () => clearTimeout(t);
  }, [search, category, level, page]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit });
      if (search) params.append('search', search);
      if (category !== 'all') params.append('category', category);
      if (level !== 'all') params.append('level', level);
      const res = await api.get(`/courses?${params}`);
      setCourses(res.data?.data?.courses || res.data?.data || []);
      setTotal(res.data?.data?.total || res.data?.total || 0);
    } catch { setCourses([]); }
    setLoading(false);
  };

  const handleEnroll = async (id) => {
    try {
      await api.post(`/courses/${id}/enroll`);
      toast.success('Enrolled successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Already enrolled or error occurred');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Explore Courses</h1>
        <p className="text-slate-400 text-sm mt-1">Learn from expertly curated content, tailored for placements</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search courses..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-300 placeholder-slate-500 outline-none focus:border-indigo-500 transition-all" />
        </div>
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-indigo-500 capitalize">
          {CATEGORIES.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c.replace('-', ' ')}</option>)}
        </select>
        <select value={level} onChange={e => { setLevel(e.target.value); setPage(1); }} className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-indigo-500 capitalize">
          {LEVELS.map(l => <option key={l} value={l}>{l === 'all' ? 'All Levels' : l}</option>)}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden animate-pulse">
              <div className="h-36 bg-white/10" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-white/10 rounded" />
                <div className="h-3 bg-white/5 rounded w-3/4" />
                <div className="h-8 bg-white/5 rounded mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No courses found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((c, i) => (
            <motion.div key={c._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <CourseCard course={c} onEnroll={handleEnroll} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 disabled:opacity-40 hover:bg-white/10 transition-colors">Prev</button>
          <span className="text-sm text-slate-400">Page {page} of {Math.ceil(total / limit)}</span>
          <button disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 disabled:opacity-40 hover:bg-white/10 transition-colors">Next</button>
        </div>
      )}
    </div>
  );
}
