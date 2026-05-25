/**
 * ============================================================================
 * Analytics Model - Smart Learning & Placement Preparation Portal
 * ============================================================================
 *
 * This model tracks daily learning analytics/metrics for each student.
 * It provides data for the student dashboard and admin analytics, including:
 *   - Tests completed and average scores
 *   - Course progress tracking
 *   - Time spent studying
 *   - Learning streak tracking
 *   - Topic strength and weakness identification
 *
 * Analytics are aggregated per user per day, enabling:
 *   - Daily progress charts
 *   - Weekly/monthly performance summaries
 *   - Trend analysis over time
 *   - Personalized learning recommendations
 *
 * @module models/Analytics
 * @requires mongoose
 */

const mongoose = require('mongoose');

/**
 * Sub-schema for tracking progress in individual courses.
 * Each entry links a course to the student's completion percentage.
 *
 * @typedef {Object} CourseProgressSchema
 * @property {ObjectId} course - Reference to the Course document
 * @property {Number} progress - Completion percentage (0-100)
 */
const courseProgressSchema = new mongoose.Schema(
  {
    /**
     * Reference to the Course document this progress entry tracks.
     * Populated when fetching analytics to display course titles.
     */
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course', // Reference to the Course model
    },

    /**
     * Completion percentage for this course (0-100).
     * Calculated as: (completed modules / total modules) * 100.
     * Updated whenever the student completes a new module.
     */
    progress: {
      type: Number,
      default: 0,
      min: [0, 'Progress cannot be negative'],
      max: [100, 'Progress cannot exceed 100'],
    },
  },
  {
    _id: false, // No separate _id for course progress sub-documents
  }
);

/**
 * Main Analytics Schema.
 *
 * @typedef {Object} AnalyticsSchema
 * @property {ObjectId} user - Reference to the student (required)
 * @property {Date} date - The date this analytics record represents
 * @property {Number} testsCompleted - Number of tests completed on this date
 * @property {Number} averageScore - Average percentage score across tests
 * @property {Array<CourseProgressSchema>} coursesProgress - Progress in enrolled courses
 * @property {Number} timeSpent - Total time spent studying in minutes
 * @property {Number} streakDays - Current consecutive days of activity
 * @property {Array<String>} strongTopics - Topics the student performs well in
 * @property {Array<String>} weakTopics - Topics needing more practice
 */
const analyticsSchema = new mongoose.Schema(
  {
    // ── User Reference ──────────────────────────────────────────────

    /**
     * Reference to the User whose analytics are being tracked.
     * Combined with `date` to form a unique daily record per user.
     */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',       // Reference to the User model
      required: [true, 'User reference is required'],
    },

    // ── Date Tracking ───────────────────────────────────────────────

    /**
     * The date this analytics record corresponds to.
     * Each user gets at most one analytics document per day.
     * Defaults to the current date when created.
     * Used for time-series queries and chart generation.
     */
    date: {
      type: Date,
      default: Date.now,
    },

    // ── Test Metrics ────────────────────────────────────────────────

    /**
     * Number of tests the student completed on this date.
     * Incremented each time the student submits a test.
     * Used for daily activity tracking and gamification.
     */
    testsCompleted: {
      type: Number,
      default: 0,
      min: [0, 'Tests completed cannot be negative'],
    },

    /**
     * Average percentage score across all tests taken on this date.
     * Recalculated each time a new test is submitted:
     *   newAvg = ((avgScore * (count-1)) + newScore) / count
     * Provides a daily performance snapshot.
     */
    averageScore: {
      type: Number,
      default: 0,
      min: [0, 'Average score cannot be negative'],
      max: [100, 'Average score cannot exceed 100'],
    },

    // ── Course Progress ─────────────────────────────────────────────

    /**
     * Array of course progress entries tracking the student's
     * advancement through enrolled courses.
     * Updated whenever the student completes a module or lesson.
     */
    coursesProgress: [courseProgressSchema],

    // ── Time Tracking ───────────────────────────────────────────────

    /**
     * Total time the student spent on the platform today, in minutes.
     * Tracked via frontend session monitoring and updated periodically.
     * Used for "Time Spent" charts and study habit analysis.
     */
    timeSpent: {
      type: Number,
      default: 0,
      min: [0, 'Time spent cannot be negative'],
    },

    // ── Streak Tracking ─────────────────────────────────────────────

    /**
     * Current learning streak — consecutive days the student has
     * been active on the platform.
     * Resets to 0 if the student misses a day.
     * Used for gamification and motivation (e.g., "5-day streak! 🔥").
     */
    streakDays: {
      type: Number,
      default: 0,
      min: [0, 'Streak days cannot be negative'],
    },

    // ── Topic Analysis ──────────────────────────────────────────────

    /**
     * Topics/categories where the student consistently scores well.
     * Identified by analyzing test results across categories.
     * Example: ['Arrays', 'JavaScript', 'SQL']
     * Shown on the dashboard as areas of strength.
     */
    strongTopics: {
      type: [String],
      default: [],
    },

    /**
     * Topics/categories where the student needs improvement.
     * Identified by analyzing test results where scores are below threshold.
     * Example: ['Dynamic Programming', 'System Design']
     * Used to generate personalized study recommendations.
     */
    weakTopics: {
      type: [String],
      default: [],
    },
  }
);

// ── Compound Index ──────────────────────────────────────────────────────
/**
 * Compound index on {user, date} for efficient queries:
 *   1. Get analytics for a specific user on a specific date
 *   2. Get all analytics for a user over a date range
 *   3. Ensure uniqueness of daily records per user (application-level)
 *
 * This is the most frequently queried combination, so indexing it
 * provides significant performance benefits.
 */
analyticsSchema.index({ user: 1, date: 1 });

// ── Create and Export the Model ─────────────────────────────────────────
/**
 * Create the Analytics model from the schema.
 * MongoDB will create an 'analytics' collection.
 */
const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = Analytics;
