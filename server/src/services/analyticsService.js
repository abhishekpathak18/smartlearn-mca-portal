/**
 * @fileoverview Analytics Service - User and Platform Analytics
 * 
 * This service handles all analytics computation for the Smart Learning Portal.
 * It provides two main functions:
 * 
 * 1. updateUserAnalytics() - Aggregates individual user performance data
 *    including test scores, course progress, learning streaks, and topic analysis.
 * 
 * 2. getPlatformStats() - Aggregates platform-wide statistics for the admin
 *    dashboard including user counts, popular courses, average scores, etc.
 * 
 * Both functions use MongoDB aggregation pipelines for efficient data processing
 * directly in the database, minimizing memory usage on the server.
 * 
 * @module services/analyticsService
 * @requires mongoose
 */

const mongoose = require('mongoose');

// ============================================================
// Lazy-load Models
// Models are loaded inside functions to avoid circular dependency issues.
// This is a common pattern in Node.js when services reference models
// that might also reference other models/services during initialization.
// ============================================================

/**
 * Helper function to safely get a Mongoose model.
 * Uses mongoose.model() which retrieves already-registered models.
 * 
 * @param {string} modelName - The name of the Mongoose model to retrieve
 * @returns {mongoose.Model} The Mongoose model instance
 */
const getModel = (modelName) => mongoose.model(modelName);

// ============================================================
// User Analytics Function
// ============================================================

/**
 * Update and compute comprehensive analytics for a specific user.
 * 
 * This function aggregates all available data for a user to create a complete
 * analytics profile. It processes test results, course enrollments, and activity
 * data to calculate metrics like average scores, learning streaks, strong/weak
 * topics, and progress over time.
 * 
 * The computed analytics can be stored in the User document for quick access
 * or returned directly for real-time display.
 * 
 * @async
 * @param {string|mongoose.Types.ObjectId} userId - The MongoDB ObjectId of the user
 * @returns {Promise<Object>} Comprehensive user analytics object
 * @returns {Object} returns.overview - High-level summary statistics
 * @returns {number} returns.overview.totalTestsTaken - Total number of tests attempted
 * @returns {number} returns.overview.averageScore - Average score across all tests
 * @returns {number} returns.overview.highestScore - Best score achieved
 * @returns {number} returns.overview.lowestScore - Lowest score achieved
 * @returns {number} returns.overview.totalCoursesEnrolled - Number of course enrollments
 * @returns {number} returns.overview.coursesCompleted - Courses fully completed
 * @returns {Object} returns.streak - Learning streak information
 * @returns {Array<Object>} returns.strongTopics - Topics with high performance
 * @returns {Array<Object>} returns.weakTopics - Topics needing improvement
 * @returns {Array<Object>} returns.recentActivity - Recent user activity log
 * @returns {Array<Object>} returns.scoreHistory - Score progression over time
 * @throws {Error} If database queries fail
 * 
 * @example
 * const analytics = await updateUserAnalytics('60d21b4667d0d8c4f8b4e1a2');
 * console.log(analytics.overview.averageScore); // 78.5
 * console.log(analytics.strongTopics); // [{ name: 'JavaScript', avgScore: 90 }]
 */
const updateUserAnalytics = async (userId) => {
  try {
    // Get model references (lazy-loaded to prevent circular dependencies)
    const Result = getModel('Result');
    const Course = getModel('Course');
    const User = getModel('User');

    // Convert userId to ObjectId if it's a string
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // ============================================================
    // 1. Aggregate Test Results
    // Uses MongoDB aggregation pipeline for efficient server-side computation
    // ============================================================

    /**
     * MongoDB Aggregation Pipeline for test score statistics.
     * Stages:
     * 1. $match - Filter results for this specific user
     * 2. $group - Calculate aggregate statistics (avg, min, max, count)
     */
    const testStatsAggregation = await Result.aggregate([
      {
        // Stage 1: Filter - only this user's results
        $match: { user: userObjectId }
      },
      {
        // Stage 2: Group - calculate aggregate stats
        $group: {
          _id: null, // Group all results together (no sub-grouping)
          totalTests: { $sum: 1 },                    // Count total tests
          averageScore: { $avg: '$score' },            // Calculate average score
          highestScore: { $max: '$score' },            // Find highest score
          lowestScore: { $min: '$score' },             // Find lowest score
          totalCorrect: { $sum: '$correctAnswers' },   // Sum all correct answers
          totalQuestions: { $sum: '$totalQuestions' },  // Sum all questions attempted
          totalTimeSent: { $sum: '$timeSpent' },       // Total time spent on tests
          passedCount: {                                // Count passed tests
            $sum: { $cond: ['$passed', 1, 0] }
          }
        }
      }
    ]);

    // Extract test stats or use defaults if no tests taken yet
    const testStats = testStatsAggregation.length > 0
      ? testStatsAggregation[0]
      : {
          totalTests: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          totalCorrect: 0,
          totalQuestions: 0,
          totalTimeSent: 0,
          passedCount: 0
        };

    // ============================================================
    // 2. Topic-Wise Performance Analysis
    // Groups results by topic/category to identify strengths and weaknesses
    // ============================================================

    const topicPerformance = await Result.aggregate([
      {
        $match: { user: userObjectId }
      },
      {
        // Lookup the test document to get the category/topic
        $lookup: {
          from: 'tests', // MongoDB collection name (lowercase plural)
          localField: 'test',
          foreignField: '_id',
          as: 'testDetails'
        }
      },
      {
        // Unwind the lookup array (each result has one test)
        $unwind: {
          path: '$testDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        // Group by test category to get per-topic stats
        $group: {
          _id: '$testDetails.category',
          avgScore: { $avg: '$score' },
          totalAttempts: { $sum: 1 },
          highestScore: { $max: '$score' },
          totalCorrect: { $sum: '$correctAnswers' },
          totalQuestions: { $sum: '$totalQuestions' }
        }
      },
      {
        // Sort by average score descending (best topics first)
        $sort: { avgScore: -1 }
      }
    ]);

    // Separate topics into strong (≥70%) and weak (<70%)
    const strongTopics = topicPerformance
      .filter((topic) => topic.avgScore >= 70)
      .map((topic) => ({
        name: topic._id || 'Uncategorized',
        avgScore: Math.round(topic.avgScore * 10) / 10, // Round to 1 decimal
        totalAttempts: topic.totalAttempts,
        accuracy: topic.totalQuestions > 0
          ? Math.round((topic.totalCorrect / topic.totalQuestions) * 100)
          : 0
      }));

    const weakTopics = topicPerformance
      .filter((topic) => topic.avgScore < 70)
      .map((topic) => ({
        name: topic._id || 'Uncategorized',
        avgScore: Math.round(topic.avgScore * 10) / 10,
        totalAttempts: topic.totalAttempts,
        accuracy: topic.totalQuestions > 0
          ? Math.round((topic.totalCorrect / topic.totalQuestions) * 100)
          : 0
      }));

    // ============================================================
    // 3. Course Enrollment Statistics
    // Count total enrolled and completed courses
    // ============================================================

    const courseStats = await Course.aggregate([
      {
        // Find courses where this user is in the enrolledUsers array
        $match: {
          'enrolledUsers.user': userObjectId
        }
      },
      {
        // Unwind enrolled users to filter for this specific user
        $unwind: '$enrolledUsers'
      },
      {
        $match: {
          'enrolledUsers.user': userObjectId
        }
      },
      {
        // Group to count total and completed enrollments
        $group: {
          _id: null,
          totalEnrolled: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$enrolledUsers.completed', true] }, 1, 0]
            }
          },
          inProgress: {
            $sum: {
              $cond: [{ $eq: ['$enrolledUsers.completed', false] }, 1, 0]
            }
          }
        }
      }
    ]);

    const courseData = courseStats.length > 0
      ? courseStats[0]
      : { totalEnrolled: 0, completed: 0, inProgress: 0 };

    // ============================================================
    // 4. Learning Streak Calculation
    // Determine how many consecutive days the user has been active
    // ============================================================

    /**
     * Calculate learning streak by looking at test completion dates.
     * A streak is defined as consecutive days with at least one test taken.
     */
    const recentResults = await Result.find({ user: userObjectId })
      .sort({ completedAt: -1 }) // Most recent first
      .select('completedAt')
      .limit(90) // Look at last 90 days max
      .lean();

    let currentStreak = 0;
    let longestStreak = 0;

    if (recentResults.length > 0) {
      // Get unique dates (format: YYYY-MM-DD) when user was active
      const activeDates = [...new Set(
        recentResults.map((r) => {
          const date = new Date(r.completedAt);
          return date.toISOString().split('T')[0]; // Get date portion only
        })
      )].sort().reverse(); // Most recent first

      // Count consecutive days starting from today
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      // Check if user was active today or yesterday to start counting
      if (activeDates[0] === today || activeDates[0] === yesterday) {
        currentStreak = 1;
        for (let i = 1; i < activeDates.length; i++) {
          const prevDate = new Date(activeDates[i - 1]);
          const currDate = new Date(activeDates[i]);
          const diffDays = Math.floor((prevDate - currDate) / 86400000);

          if (diffDays === 1) {
            currentStreak++;
          } else {
            break; // Streak broken
          }
        }
      }

      // Calculate longest streak from all activity
      let tempStreak = 1;
      for (let i = 1; i < activeDates.length; i++) {
        const prevDate = new Date(activeDates[i - 1]);
        const currDate = new Date(activeDates[i]);
        const diffDays = Math.floor((prevDate - currDate) / 86400000);

        if (diffDays === 1) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    // ============================================================
    // 5. Score History (for trend charts)
    // Get score progression over time for line chart visualization
    // ============================================================

    const scoreHistory = await Result.find({ user: userObjectId })
      .sort({ completedAt: 1 }) // Chronological order
      .select('score completedAt')
      .limit(50) // Last 50 results for the chart
      .lean();

    // ============================================================
    // 6. Compile the Complete Analytics Object
    // ============================================================

    const analytics = {
      // High-level overview statistics
      overview: {
        totalTestsTaken: testStats.totalTests,
        averageScore: Math.round(testStats.averageScore * 10) / 10,
        highestScore: testStats.highestScore,
        lowestScore: testStats.lowestScore,
        passRate: testStats.totalTests > 0
          ? Math.round((testStats.passedCount / testStats.totalTests) * 100)
          : 0,
        totalCoursesEnrolled: courseData.totalEnrolled,
        coursesCompleted: courseData.completed,
        coursesInProgress: courseData.inProgress,
        overallAccuracy: testStats.totalQuestions > 0
          ? Math.round((testStats.totalCorrect / testStats.totalQuestions) * 100)
          : 0,
        totalTimeSpent: testStats.totalTimeSent // in seconds
      },

      // Learning streak data
      streak: {
        current: currentStreak,
        longest: longestStreak
      },

      // Topic-wise performance breakdown
      strongTopics,
      weakTopics,
      allTopics: topicPerformance.map((t) => ({
        name: t._id || 'Uncategorized',
        avgScore: Math.round(t.avgScore * 10) / 10,
        totalAttempts: t.totalAttempts,
        highestScore: t.highestScore
      })),

      // Score progression over time (for charts)
      scoreHistory: scoreHistory.map((r) => ({
        score: r.score,
        date: r.completedAt
      })),

      // Timestamp when analytics were last computed
      lastUpdated: new Date()
    };

    // ============================================================
    // 7. Optionally Save Analytics to User Document
    // This allows quick access without re-computation
    // ============================================================
    try {
      await User.findByIdAndUpdate(userId, {
        analytics: analytics
      });
    } catch (updateError) {
      // Non-critical - log but don't throw
      console.warn('Could not save analytics to user document:', updateError.message);
    }

    return analytics;
  } catch (error) {
    console.error('Error computing user analytics:', error.message);
    throw new Error(`Failed to compute user analytics: ${error.message}`);
  }
};

// ============================================================
// Platform-Wide Statistics Function (Admin Dashboard)
// ============================================================

/**
 * Get platform-wide statistics for the admin dashboard.
 * 
 * Aggregates data across all users, courses, and tests to provide
 * administrators with a comprehensive overview of platform usage,
 * performance metrics, and growth trends.
 * 
 * @async
 * @returns {Promise<Object>} Platform-wide statistics
 * @returns {Object} returns.users - User statistics (total, active, new)
 * @returns {Object} returns.courses - Course statistics (total, popular)
 * @returns {Object} returns.tests - Test statistics (total, submissions)
 * @returns {Object} returns.performance - Platform-wide performance metrics
 * @returns {Array<Object>} returns.recentRegistrations - Latest user signups
 * @returns {Array<Object>} returns.topPerformers - Highest-scoring users
 * @throws {Error} If database aggregation queries fail
 * 
 * @example
 * const stats = await getPlatformStats();
 * console.log(stats.users.total); // 1500
 * console.log(stats.performance.averageScore); // 72.3
 */
const getPlatformStats = async () => {
  try {
    const User = getModel('User');
    const Course = getModel('Course');
    const Test = getModel('Test');
    const Result = getModel('Result');

    // ============================================================
    // 1. User Statistics
    // ============================================================

    // Total user count
    const totalUsers = await User.countDocuments();

    // Active users (logged in within last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: thirtyDaysAgo }
    });

    // New users this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // New users this week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: startOfWeek }
    });

    // User role distribution
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // ============================================================
    // 2. Course Statistics
    // ============================================================

    const totalCourses = await Course.countDocuments();

    // Most popular courses (by enrollment count)
    const popularCourses = await Course.aggregate([
      {
        $addFields: {
          enrollmentCount: { $size: { $ifNull: ['$enrolledUsers', []] } }
        }
      },
      { $sort: { enrollmentCount: -1 } },
      { $limit: 5 },
      {
        $project: {
          title: 1,
          category: 1,
          enrollmentCount: 1,
          averageRating: 1
        }
      }
    ]);

    // Total enrollments across all courses
    const totalEnrollments = await Course.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: { $size: { $ifNull: ['$enrolledUsers', []] } } }
        }
      }
    ]);

    // ============================================================
    // 3. Test Statistics
    // ============================================================

    const totalTests = await Test.countDocuments();
    const totalSubmissions = await Result.countDocuments();

    // Average platform-wide score
    const platformScoreStats = await Result.aggregate([
      {
        $group: {
          _id: null,
          averageScore: { $avg: '$score' },
          highestScore: { $max: '$score' },
          totalPassed: { $sum: { $cond: ['$passed', 1, 0] } },
          totalFailed: { $sum: { $cond: ['$passed', 0, 1] } }
        }
      }
    ]);

    const scoreStats = platformScoreStats.length > 0
      ? platformScoreStats[0]
      : { averageScore: 0, highestScore: 0, totalPassed: 0, totalFailed: 0 };

    // Most attempted tests
    const popularTests = await Result.aggregate([
      {
        $group: {
          _id: '$test',
          attempts: { $sum: 1 },
          avgScore: { $avg: '$score' }
        }
      },
      { $sort: { attempts: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'tests',
          localField: '_id',
          foreignField: '_id',
          as: 'testDetails'
        }
      },
      { $unwind: { path: '$testDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          testTitle: '$testDetails.title',
          category: '$testDetails.category',
          attempts: 1,
          avgScore: { $round: ['$avgScore', 1] }
        }
      }
    ]);

    // ============================================================
    // 4. Recent Activity
    // ============================================================

    // Recent registrations (last 10)
    const recentRegistrations = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email createdAt role')
      .lean();

    // Top performing users (by average score, min 3 tests)
    const topPerformers = await Result.aggregate([
      {
        $group: {
          _id: '$user',
          avgScore: { $avg: '$score' },
          totalTests: { $sum: 1 }
        }
      },
      { $match: { totalTests: { $gte: 3 } } }, // At least 3 tests taken
      { $sort: { avgScore: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: '$userDetails.name',
          email: '$userDetails.email',
          avgScore: { $round: ['$avgScore', 1] },
          totalTests: 1
        }
      }
    ]);

    // ============================================================
    // 5. Growth Trends (last 7 days)
    // Daily new user registrations for the admin chart
    // ============================================================

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailyRegistrations = await User.aggregate([
      {
        $match: { createdAt: { $gte: sevenDaysAgo } }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dailySubmissions = await Result.aggregate([
      {
        $match: { completedAt: { $gte: sevenDaysAgo } }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$completedAt' }
          },
          count: { $sum: 1 },
          avgScore: { $avg: '$score' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // ============================================================
    // 6. Compile Platform Statistics Object
    // ============================================================

    return {
      // User metrics
      users: {
        total: totalUsers,
        active: activeUsers,
        newThisMonth: newUsersThisMonth,
        newThisWeek: newUsersThisWeek,
        roleDistribution: roleDistribution.reduce((acc, role) => {
          acc[role._id || 'user'] = role.count;
          return acc;
        }, {})
      },

      // Course metrics
      courses: {
        total: totalCourses,
        totalEnrollments: totalEnrollments.length > 0 ? totalEnrollments[0].total : 0,
        popular: popularCourses
      },

      // Test metrics
      tests: {
        total: totalTests,
        totalSubmissions,
        averageScore: Math.round((scoreStats.averageScore || 0) * 10) / 10,
        highestScore: scoreStats.highestScore || 0,
        passRate: totalSubmissions > 0
          ? Math.round((scoreStats.totalPassed / totalSubmissions) * 100)
          : 0,
        popular: popularTests
      },

      // Trends
      trends: {
        dailyRegistrations,
        dailySubmissions
      },

      // Lists
      recentRegistrations,
      topPerformers,

      // Metadata
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('Error computing platform stats:', error.message);
    throw new Error(`Failed to compute platform statistics: ${error.message}`);
  }
};

// ============================================================
// Export all analytics service functions
// Used by analytics and admin controllers
// ============================================================
module.exports = {
  updateUserAnalytics,
  getPlatformStats
};
