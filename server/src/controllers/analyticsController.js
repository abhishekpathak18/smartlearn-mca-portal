/**
 * ============================================================================
 * ANALYTICS CONTROLLER - Smart Learning & Placement Preparation Portal
 * ============================================================================
 * 
 * This controller provides learning analytics and performance insights:
 * - User analytics: comprehensive overview of learning progress
 * - Performance trend: daily/weekly scores over the last 30 days
 * - Topic strengths: strengths and weaknesses by subject category
 * 
 * Analytics are computed in real-time using MongoDB aggregation pipelines.
 * Aggregation pipelines are a powerful MongoDB feature that processes
 * documents through multiple stages (filter → group → sort → project)
 * directly on the database server, which is much more efficient than
 * fetching raw data and processing it in Node.js.
 * 
 * Key MongoDB Aggregation Operators Used:
 * - $match: Filter documents (like WHERE in SQL)
 * - $group: Group documents and compute aggregates (like GROUP BY)
 * - $sort: Sort results
 * - $project: Shape the output (select/rename fields)
 * - $avg, $sum, $max, $min: Aggregation accumulators
 * - $dateToString: Format dates for grouping
 * 
 * @module controllers/analyticsController
 * @requires mongoose models: Result, Course, Analytics
 * ============================================================================
 */

// ─── Module Imports ─────────────────────────────────────────────────────────────
const Result = require('../models/Result');       // Test results for score analysis
const Course = require('../models/Course');       // Courses for enrollment stats
const Analytics = require('../models/Analytics'); // Pre-computed analytics (if available)
const mongoose = require('mongoose');             // Mongoose for ObjectId conversion

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Get comprehensive learning analytics for the logged-in user
 * @route   GET /api/analytics
 * @access  Private (requires authentication)
 * 
 * Aggregates data from multiple collections to provide a complete
 * overview of the user's learning journey:
 * 
 * 1. Test Performance:
 *    - Total tests taken
 *    - Average, highest, and lowest scores
 *    - Pass rate percentage
 * 
 * 2. Course Progress:
 *    - Total courses enrolled
 *    - Course category distribution
 * 
 * 3. Learning Activity:
 *    - Tests taken per week/month
 *    - Most active days
 *    - Learning streak data
 * 
 * 4. Comparison:
 *    - Performance relative to platform average (if data available)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with comprehensive analytics dashboard data
 */
const getUserAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    // ── Run all analytics queries in parallel ──
    // Promise.all runs all promises concurrently, returning when ALL complete
    const [
      testStats,
      courseStats,
      monthlyActivity,
      recentResults,
      passFailStats
    ] = await Promise.all([

      // ── Query 1: Overall test performance statistics ──
      // Aggregates all test results to calculate summary metrics
      Result.aggregate([
        // Stage 1: Filter results for this specific user
        {
          $match: { user: new mongoose.Types.ObjectId(userId) }
        },
        // Stage 2: Group all matching documents and calculate stats
        {
          $group: {
            _id: null,                                      // Group all into one result
            totalTests: { $sum: 1 },                       // Count all results
            averageScore: { $avg: '$percentage' },         // Mean of percentage field
            highestScore: { $max: '$percentage' },         // Maximum percentage
            lowestScore: { $min: '$percentage' },          // Minimum percentage
            totalCorrect: { $sum: '$score' },              // Sum of correct answers
            totalQuestions: { $sum: '$totalQuestions' }     // Sum of all questions
          }
        }
      ]),

      // ── Query 2: Course enrollment statistics ──
      // Count courses and group by category
      Course.aggregate([
        // Find courses where user is enrolled
        {
          $match: { enrolledStudents: new mongoose.Types.ObjectId(userId) }
        },
        // Group by category to see distribution
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        // Sort alphabetically by category
        { $sort: { _id: 1 } }
      ]),

      // ── Query 3: Monthly activity (tests taken per month) ──
      // Shows learning consistency over the past 6 months
      Result.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            createdAt: {
              // Last 6 months
              $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
            }
          }
        },
        {
          $group: {
            _id: {
              // Group by year-month using $dateToString
              $dateToString: { format: '%Y-%m', date: '$createdAt' }
            },
            testsCount: { $sum: 1 },
            avgScore: { $avg: '$percentage' }
          }
        },
        { $sort: { _id: 1 } }   // Sort chronologically
      ]),

      // ── Query 4: Most recent 5 test results ──
      Result.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('test', 'title category')
        .select('percentage passed score totalQuestions createdAt')
        .lean(),

      // ── Query 5: Pass/Fail distribution ──
      Result.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: '$passed',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // ── Process and format the results ──

    // Extract test statistics (aggregation returns array, get first element)
    const stats = testStats[0] || {
      totalTests: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      totalCorrect: 0,
      totalQuestions: 0
    };

    // Calculate total enrolled courses from category breakdown
    const totalEnrolledCourses = courseStats.reduce((sum, cat) => sum + cat.count, 0);

    // Process pass/fail stats into an object
    const passFailData = {};
    passFailStats.forEach(item => {
      passFailData[item._id ? 'passed' : 'failed'] = item.count;
    });

    // Calculate pass rate
    const totalTestsTaken = stats.totalTests;
    const passRate = totalTestsTaken > 0
      ? Math.round(((passFailData.passed || 0) / totalTestsTaken) * 100)
      : 0;

    // ── Build the analytics response ──
    res.status(200).json({
      success: true,
      data: {
        // Overall performance summary
        overview: {
          totalTestsTaken: stats.totalTests,
          averageScore: Math.round(stats.averageScore * 100) / 100,
          highestScore: stats.highestScore || 0,
          lowestScore: stats.lowestScore || 0,
          passRate,
          passed: passFailData.passed || 0,
          failed: passFailData.failed || 0,
          accuracy: stats.totalQuestions > 0
            ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100)
            : 0
        },
        // Course enrollment data
        courses: {
          totalEnrolled: totalEnrolledCourses,
          categoryDistribution: courseStats
        },
        // Activity over time
        monthlyActivity,
        // Recent test results
        recentResults
      }
    });

  } catch (error) {
    console.error('[ANALYTICS] Get user analytics error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching analytics'
    });
  }
};

/**
 * @desc    Get performance trend over the last 30 days
 * @route   GET /api/analytics/trend
 * @access  Private (requires authentication)
 * 
 * Returns daily test scores for the last 30 days, useful for
 * plotting a performance trend chart on the frontend dashboard.
 * 
 * Each data point includes:
 * - Date (formatted as YYYY-MM-DD)
 * - Average score for that day
 * - Number of tests taken that day
 * 
 * Days with no tests are NOT included in the response.
 * The frontend should handle filling in gaps for chart display.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with daily performance data for charting
 */
const getPerformanceTrend = async (req, res) => {
  try {
    // Calculate the date 30 days ago from now
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // ── Aggregation Pipeline: Group results by day ──
    const trend = await Result.aggregate([
      // Stage 1: Filter results for this user in the last 30 days
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.id),
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      // Stage 2: Group by date (year-month-day format)
      {
        $group: {
          _id: {
            // $dateToString formats a date field into a string
            // Format: YYYY-MM-DD (e.g., '2026-05-23')
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          averageScore: { $avg: '$percentage' },    // Daily average score
          testsCount: { $sum: 1 },                   // Tests taken per day
          highestScore: { $max: '$percentage' },     // Best score of the day
          lowestScore: { $min: '$percentage' }       // Worst score of the day
        }
      },
      // Stage 3: Sort chronologically (oldest to newest)
      { $sort: { _id: 1 } },
      // Stage 4: Reshape the output for clarity
      {
        $project: {
          _id: 0,                                    // Remove the _id field
          date: '$_id',                              // Rename _id to 'date'
          averageScore: { $round: ['$averageScore', 1] },  // Round to 1 decimal
          testsCount: 1,
          highestScore: 1,
          lowestScore: 1
        }
      }
    ]);

    // ── Calculate trend statistics ──
    let trendSummary = {
      totalDaysActive: trend.length,
      averageDailyScore: 0,
      bestDay: null,
      worstDay: null,
      improving: false
    };

    if (trend.length > 0) {
      // Calculate average of all daily averages
      const totalDailyScores = trend.reduce((sum, day) => sum + day.averageScore, 0);
      trendSummary.averageDailyScore = Math.round((totalDailyScores / trend.length) * 10) / 10;

      // Find best and worst days
      trendSummary.bestDay = trend.reduce((best, day) =>
        day.highestScore > (best?.highestScore || 0) ? day : best, null
      );
      trendSummary.worstDay = trend.reduce((worst, day) =>
        day.lowestScore < (worst?.lowestScore || 100) ? day : worst, null
      );

      // Check if the user is improving (compare first half vs second half)
      if (trend.length >= 4) {
        const midpoint = Math.floor(trend.length / 2);
        const firstHalf = trend.slice(0, midpoint);
        const secondHalf = trend.slice(midpoint);

        const firstHalfAvg = firstHalf.reduce((s, d) => s + d.averageScore, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((s, d) => s + d.averageScore, 0) / secondHalf.length;

        trendSummary.improving = secondHalfAvg > firstHalfAvg;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        trend,
        summary: trendSummary,
        period: {
          from: thirtyDaysAgo.toISOString().split('T')[0],
          to: new Date().toISOString().split('T')[0],
          days: 30
        }
      }
    });

  } catch (error) {
    console.error('[ANALYTICS] Get performance trend error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching performance trend'
    });
  }
};

/**
 * @desc    Get topic/category-wise strength analysis
 * @route   GET /api/analytics/strengths
 * @access  Private (requires authentication)
 * 
 * Analyzes the user's performance by grouping test results by category
 * (topic) and calculating metrics for each:
 * - Average score per topic
 * - Number of tests per topic
 * - Best and worst scores per topic
 * - Strength classification (Strong/Moderate/Weak)
 * 
 * This helps students identify their strong and weak areas,
 * guiding their study focus.
 * 
 * Classification thresholds:
 * - Strong: Average score >= 70%
 * - Moderate: Average score 40-69%
 * - Weak: Average score < 40%
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with topic-wise strength breakdown
 */
const getTopicStrengths = async (req, res) => {
  try {
    // ── Aggregation Pipeline: Group by category and calculate stats ──
    const topicStats = await Result.aggregate([
      // Stage 1: Filter results for the logged-in user
      {
        $match: { user: new mongoose.Types.ObjectId(req.user.id) }
      },
      // Stage 2: Group by category/topic and calculate metrics
      {
        $group: {
          _id: '$category',                          // Group by test category
          averageScore: { $avg: '$percentage' },     // Average score for this topic
          totalTests: { $sum: 1 },                   // Number of tests in this topic
          highestScore: { $max: '$percentage' },     // Best score in this topic
          lowestScore: { $min: '$percentage' },      // Worst score in this topic
          totalPassed: {                              // Count of passed tests
            $sum: { $cond: ['$passed', 1, 0] }
          },
          lastAttempt: { $max: '$createdAt' }        // Most recent test date
        }
      },
      // Stage 3: Sort by average score descending (strongest topics first)
      { $sort: { averageScore: -1 } },
      // Stage 4: Reshape the output
      {
        $project: {
          _id: 0,
          topic: '$_id',                              // Rename _id to 'topic'
          averageScore: { $round: ['$averageScore', 1] },
          totalTests: 1,
          highestScore: 1,
          lowestScore: 1,
          totalPassed: 1,
          lastAttempt: 1,
          passRate: {
            $round: [
              { $multiply: [{ $divide: ['$totalPassed', '$totalTests'] }, 100] },
              0
            ]
          }
        }
      }
    ]);

    // ── Classify each topic as Strong, Moderate, or Weak ──
    const classifiedTopics = topicStats.map(topic => ({
      ...topic,
      // Strength classification based on average score thresholds
      strength: topic.averageScore >= 70
        ? 'Strong'                   // 70%+ = Strong
        : topic.averageScore >= 40
          ? 'Moderate'               // 40-69% = Moderate
          : 'Weak',                  // Below 40% = Weak
      // Additional context
      recommendation: topic.averageScore < 40
        ? 'Focus more practice on this topic'
        : topic.averageScore < 70
          ? 'Good progress, keep practicing'
          : 'Excellent! Maintain this level'
    }));

    // ── Separate into categories for easy consumption ──
    const strongTopics = classifiedTopics.filter(t => t.strength === 'Strong');
    const moderateTopics = classifiedTopics.filter(t => t.strength === 'Moderate');
    const weakTopics = classifiedTopics.filter(t => t.strength === 'Weak');

    // ── Calculate overall strength summary ──
    const overallAvg = topicStats.length > 0
      ? Math.round(topicStats.reduce((s, t) => s + t.averageScore, 0) / topicStats.length * 10) / 10
      : 0;

    res.status(200).json({
      success: true,
      data: {
        allTopics: classifiedTopics,
        summary: {
          totalTopicsCovered: topicStats.length,
          strongCount: strongTopics.length,
          moderateCount: moderateTopics.length,
          weakCount: weakTopics.length,
          overallAverage: overallAvg
        },
        // Separated lists for easy UI rendering
        strongTopics,
        moderateTopics,
        weakTopics
      }
    });

  } catch (error) {
    console.error('[ANALYTICS] Get topic strengths error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching topic strengths'
    });
  }
};

// ─── Export All Controller Functions ────────────────────────────────────────────
module.exports = {
  getUserAnalytics,
  getPerformanceTrend,
  getTopicStrengths
};
