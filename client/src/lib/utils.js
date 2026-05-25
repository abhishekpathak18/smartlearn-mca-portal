// Utility helper functions for the SmartLearn portal

/**
 * Format a date to a readable string
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

/**
 * Format duration in minutes to "Xh Ym" format
 */
export const formatDuration = (minutes) => {
  if (!minutes) return 'N/A';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

/**
 * Truncate text to a specified length
 */
export const truncateText = (text, length = 100) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

/**
 * Get initials from a full name
 */
export const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Get color class based on percentage score
 */
export const getScoreColor = (percentage) => {
  if (percentage >= 80) return 'text-green-400';
  if (percentage >= 60) return 'text-yellow-400';
  return 'text-red-400';
};

/**
 * Get background color class based on percentage score
 */
export const getScoreBgColor = (percentage) => {
  if (percentage >= 80) return 'bg-green-500/20 text-green-400';
  if (percentage >= 60) return 'bg-yellow-500/20 text-yellow-400';
  return 'bg-red-500/20 text-red-400';
};

/**
 * Format large numbers (e.g. 1200 -> 1.2k)
 */
export const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
};

/**
 * Calculate time ago from a date
 */
export const timeAgo = (date) => {
  if (!date) return '';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
};

/**
 * Generate a consistent gradient background based on string (for avatars)
 */
export const generateAvatarGradient = (name) => {
  const gradients = [
    'from-indigo-500 to-purple-600',
    'from-cyan-500 to-blue-600',
    'from-pink-500 to-rose-600',
    'from-amber-500 to-orange-600',
    'from-green-500 to-emerald-600',
    'from-violet-500 to-purple-600',
  ];
  if (!name) return gradients[0];
  const index = name.charCodeAt(0) % gradients.length;
  return gradients[index];
};

/**
 * Format seconds to mm:ss
 */
export const formatTime = (seconds) => {
  if (!seconds) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};
