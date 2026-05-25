// Navigation items for student sidebar
export const STUDENT_NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Courses', href: '/courses', icon: 'BookOpen' },
  { label: 'Tests & Quizzes', href: '/tests', icon: 'ClipboardCheck' },
  { label: 'My Results', href: '/results', icon: 'BarChart2' },
  { label: 'Interview Prep', href: '/interview-prep', icon: 'Mic' },
  { label: 'Resume Analyzer', href: '/resume-analyzer', icon: 'FileText' },
  { label: 'AI Assistant', href: '/ai-assistant', icon: 'Bot' },
  { label: 'Placement Roadmap', href: '/placement-roadmap', icon: 'Map' },
  { label: 'Notifications', href: '/notifications', icon: 'Bell' },
  { label: 'My Profile', href: '/profile', icon: 'User' },
];

// Navigation items for admin sidebar
export const ADMIN_NAV = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: 'LayoutDashboard' },
  { label: 'Users', href: '/admin/users', icon: 'Users' },
  { label: 'Courses', href: '/admin/courses', icon: 'BookOpen' },
  { label: 'Tests', href: '/admin/tests', icon: 'ClipboardCheck' },
  { label: 'Analytics', href: '/admin/analytics', icon: 'TrendingUp' },
  { label: 'Placements', href: '/admin/placements', icon: 'Briefcase' },
  { label: 'Activity Logs', href: '/admin/activity-logs', icon: 'Activity' },
];

export const COURSE_CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'programming', label: 'Programming' },
  { value: 'dsa', label: 'DSA' },
  { value: 'web-dev', label: 'Web Development' },
  { value: 'database', label: 'Database' },
  { value: 'ai-ml', label: 'AI & ML' },
  { value: 'aptitude', label: 'Aptitude' },
  { value: 'soft-skills', label: 'Soft Skills' },
];

export const LEVELS = [
  { value: '', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export const TEST_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'mock-test', label: 'Mock Test' },
  { value: 'practice', label: 'Practice' },
];

export const CATEGORY_COLORS = {
  programming: 'from-blue-500 to-cyan-500',
  dsa: 'from-purple-500 to-pink-500',
  'web-dev': 'from-orange-500 to-amber-500',
  database: 'from-green-500 to-emerald-500',
  'ai-ml': 'from-violet-500 to-purple-500',
  aptitude: 'from-red-500 to-rose-500',
  'soft-skills': 'from-teal-500 to-cyan-500',
};
