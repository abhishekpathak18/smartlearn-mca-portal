/**
 * ============================================================================
 * TEST CONTROLLER - Smart Learning & Placement Preparation Portal
 * ============================================================================
 * 
 * This controller handles all test/quiz-related operations:
 * - Browse available tests with pagination and filtering
 * - View a specific test (with questions but hidden answers)
 * - Submit test answers and auto-calculate score
 * - View test results for a user
 * 
 * Test flow:
 * 1. Student browses available tests (getTests)
 * 2. Student opens a test to take it (getTest - answers hidden)
 * 3. Student submits their answers (submitTest)
 * 4. System auto-grades, calculates score, saves Result
 * 5. Student views their results (getTestResults)
 * 
 * Scoring logic:
 * - Each question has equal weight
 * - Score = (correct answers / total questions) * 100
 * - Results are saved with per-question breakdown
 * 
 * @module controllers/testController
 * @requires mongoose models: Test, Result, Notification, Analytics
 * ============================================================================
 */

// ─── Module Imports ─────────────────────────────────────────────────────────────
const Test = require('../models/Test');                   // Test model with questions
const Result = require('../models/Result');               // Result model for test outcomes
const Notification = require('../models/Notification');   // Notifications for test completion
const Analytics = require('../models/Analytics');         // User analytics tracking
const mongoose = require('mongoose');                     // Mongoose for ObjectId validation

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Get all available tests with pagination and filtering
 * @route   GET /api/tests
 * @access  Private (requires authentication)
 * 
 * Supports query parameters:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 10, max: 50)
 * - category: Filter by test category (e.g., 'javascript', 'python')
 * - type: Filter by test type (e.g., 'mcq', 'coding', 'aptitude')
 * - difficulty: Filter by difficulty (easy, medium, hard)
 * - search: Search in test title and description
 * 
 * Note: Questions are NOT returned in the list view (performance optimization).
 * Use getTest to fetch full test with questions.
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters for filtering
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with paginated tests array
 */
const getTests = async (req, res) => {
  try {
    // ── Parse pagination parameters ──
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;

    // ── Build filter query from query parameters ──
    const filterQuery = {};

    // Filter by category (e.g., 'javascript', 'data-structures')
    if (req.query.category) {
      filterQuery.category = req.query.category;
    }

    // Filter by test type (e.g., 'mcq', 'coding', 'aptitude')
    if (req.query.type) {
      filterQuery.type = req.query.type;
    }

    // Filter by difficulty level
    if (req.query.difficulty) {
      filterQuery.difficulty = req.query.difficulty;
    }

    // Search in title and description using case-insensitive regex
    if (req.query.search) {
      filterQuery.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Only show published tests
    filterQuery.isPublished = true;

    // ── Execute queries in parallel ──
    const [tests, totalTests] = await Promise.all([
      Test.find(filterQuery)
        .sort({ createdAt: -1 })           // Newest tests first
        .skip(skip)
        .limit(limit)
        .select('-questions')               // Exclude questions in list view (performance + security)
        .lean(),                            // Return plain objects

      Test.countDocuments(filterQuery)
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalTests / limit);

    res.status(200).json({
      success: true,
      data: {
        tests,
        pagination: {
          currentPage: page,
          totalPages,
          totalTests,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('[TEST] Get tests error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching tests'
    });
  }
};

/**
 * @desc    Get a single test with questions (but hidden correct answers)
 * @route   GET /api/tests/:id
 * @access  Private (requires authentication)
 * 
 * Returns the full test document including all questions and their options,
 * but HIDES the correctAnswer field from each question. This is essential
 * for test integrity - students shouldn't see the answers while taking the test.
 * 
 * We use MongoDB projection to exclude the correctAnswer field at the
 * database level, ensuring it never reaches the client.
 * 
 * @param {Object} req - Express request object
 * @param {string} req.params.id - The MongoDB ObjectId of the test
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with test data (answers hidden)
 */
const getTest = async (req, res) => {
  try {
    // Step 1: Validate the test ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid test ID format'
      });
    }

    // Step 2: Find the test and exclude correctAnswer from questions
    // The '-questions.correctAnswer' projection tells MongoDB to exclude
    // the correctAnswer field from each element in the questions array
    const test = await Test.findById(req.params.id)
      .select('-questions.correctAnswer -questions.explanation')
      .lean();

    // Step 3: Check if test exists
    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }

    // Step 4: Add metadata useful for the frontend
    const testResponse = {
      ...test,
      totalQuestions: test.questions ? test.questions.length : 0,
      // Check if this user has already taken this test
      // This can be used by the frontend to show "Retake" vs "Take Test"
    };

    res.status(200).json({
      success: true,
      data: testResponse
    });

  } catch (error) {
    console.error('[TEST] Get test error:', error.message);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid test ID format'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error while fetching test'
    });
  }
};

/**
 * @desc    Submit test answers, calculate score, and create a Result
 * @route   POST /api/tests/:id/submit
 * @access  Private (requires authentication)
 * 
 * This is the core grading function. Flow:
 * 1. Validate the submission format
 * 2. Fetch the test with correct answers
 * 3. Compare each submitted answer with the correct answer
 * 4. Calculate score and percentage
 * 5. Create a Result document with detailed breakdown
 * 6. Update user's Analytics document
 * 7. Create a notification about test completion
 * 8. Respond with results
 * 
 * Submission format:
 * {
 *   answers: [
 *     { questionId: "60d5ec49...", selectedOption: "B" },
 *     { questionId: "60d5ec4a...", selectedOption: "A" },
 *     ...
 *   ],
 *   timeTaken: 300  // Time taken in seconds (optional)
 * }
 * 
 * @param {Object} req - Express request object
 * @param {Array} req.body.answers - Array of answer objects
 * @param {number} [req.body.timeTaken] - Time taken in seconds
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with test results and score breakdown
 */
const submitTest = async (req, res) => {
  try {
    const { answers, timeTaken } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, error: 'Please provide answers array' });
    }

    // Fetch full test with correct answers
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ success: false, error: 'Test not found' });
    }

    // Grade answers — frontend sends { questionIndex, selectedAnswer }
    let totalScore = 0;
    const gradedAnswers = test.questions.map((question, idx) => {
      const submission = answers.find(a => a.questionIndex === idx);
      const selectedAnswer = submission ? submission.selectedAnswer : -1;
      const isCorrect = selectedAnswer === question.correctAnswer;
      if (isCorrect) totalScore += (question.marks || 1);
      return { questionIndex: idx, selectedAnswer, isCorrect };
    });

    const totalMarks = test.totalMarks || test.questions.reduce((s, q) => s + (q.marks || 1), 0);
    const percentage = Math.round((totalScore / totalMarks) * 100);

    // Create Result
    const result = await Result.create({
      user: req.user.id,
      test: test._id,
      answers: gradedAnswers,
      score: totalScore,
      totalMarks,
      percentage,
      timeTaken: timeTaken || 0,
      submittedAt: new Date(),
    });

    // Increment test attempts
    await Test.findByIdAndUpdate(test._id, { $inc: { attempts: 1 } });

    // Notification
    try {
      await Notification.create({
        user: req.user.id,
        title: 'Test Completed! 🎉',
        message: `You scored ${percentage}% on "${test.title}". ${percentage >= (test.passingMarks / totalMarks * 100) ? 'You passed! Keep it up!' : 'Practice more to improve.'}`,
        type: percentage >= 60 ? 'success' : 'info',
      });
    } catch { /* non-critical */ }

    res.status(201).json({
      success: true,
      message: `Test submitted! You scored ${percentage}%`,
      data: {
        _id: result._id,
        score: totalScore,
        totalMarks,
        percentage,
        timeTaken: timeTaken || 0,
        correctAnswers: gradedAnswers.filter(a => a.isCorrect).length,
        totalQuestions: test.questions.length,
        passed: percentage >= Math.round((test.passingMarks / totalMarks) * 100),
      }
    });
  } catch (error) {
    console.error('[TEST] Submit error:', error.message);
    res.status(500).json({ success: false, error: 'Server error while submitting test' });
  }
};


/**
 * @desc    Get all results for a specific test for the logged-in user

 * @route   GET /api/tests/:id/results
 * @access  Private (requires authentication)
 * 
 * Returns all attempts/results the user has for a specific test,
 * sorted by date (newest first). This allows users to track their
 * progress on a particular test over multiple attempts.
 * 
 * @param {Object} req - Express request object
 * @param {string} req.params.id - The test ID to get results for
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with array of test results
 */
const getTestResults = async (req, res) => {
  try {
    // Validate test ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid test ID format'
      });
    }

    // Find all results for this user and this specific test
    const results = await Result.find({
      user: req.user.id,
      test: req.params.id
    })
      .sort({ createdAt: -1 })    // Newest results first
      .populate('test', 'title category difficulty')  // Include basic test info
      .lean();

    // Calculate improvement stats if there are multiple attempts
    let improvement = null;
    if (results.length >= 2) {
      const latestScore = results[0].percentage;
      const firstScore = results[results.length - 1].percentage;
      improvement = {
        firstAttempt: firstScore,
        latestAttempt: latestScore,
        change: latestScore - firstScore,
        improved: latestScore > firstScore
      };
    }

    res.status(200).json({
      success: true,
      data: {
        results,
        totalAttempts: results.length,
        improvement
      }
    });

  } catch (error) {
    console.error('[TEST] Get test results error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching test results'
    });
  }
};

// ─── Export All Controller Functions ────────────────────────────────────────────
module.exports = {
  getTests,
  getTest,
  submitTest,
  getTestResults
};
