/**
 * @fileoverview AI-Powered Feature Routes
 * 
 * This file defines all AI-related API routes for the Smart Learning Portal.
 * Uses Google Gemini AI to provide intelligent features like interview question
 * generation, resume analysis, career recommendations, AI chat, and
 * personalized placement roadmaps.
 * 
 * All routes require authentication AND are rate-limited to prevent
 * excessive API usage (Gemini API has usage quotas and costs).
 * 
 * Route Prefix: /api/ai
 * 
 * @module routes/aiRoutes
 * @requires express
 * @requires express-validator
 * @requires express-rate-limit
 * @requires ../controllers/aiController
 * @requires ../middleware/auth
 * @requires ../middleware/validate
 */

const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');

// ============================================================
// Import Controller Functions
// ============================================================
const {
  generateInterviewQuestions,
  analyzeResume,
  getCareerRecommendation,
  chatWithAI,
  getPlacementRoadmap
} = require('../controllers/aiController');

// ============================================================
// Import Middleware
// - protect: JWT authentication check
// - validate: Express-validator error handler
// ============================================================
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// ============================================================
// Create Express Router Instance
// This router will be mounted at /api/ai in the main app
// ============================================================
const router = express.Router();

// ============================================================
// AI Rate Limiter Configuration
// Limits AI endpoint usage to prevent abuse and manage API costs.
// Each user is limited to 20 requests per 15-minute window.
// This is separate from the global rate limiter for stricter control.
// ============================================================

/**
 * AI-specific rate limiter
 * - windowMs: 15 minutes (900,000 ms) - the time window for counting requests
 * - max: 20 requests per window per user
 * - message: Custom error response matching our API format
 * - standardHeaders: Sends RateLimit-* headers in response
 * - legacyHeaders: Disables deprecated X-RateLimit-* headers
 * - keyGenerator: Uses the authenticated user's ID instead of IP address
 *   This ensures rate limiting is per-user, not per-IP (important for shared IPs)
 */
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 30, // Maximum 30 AI requests per 15 minutes per IP
  message: {
    success: false,
    error: 'Too many AI requests. Please wait 15 minutes before trying again.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================
// Apply Middleware to ALL Routes
// Order matters: authenticate first, then rate limit
// ============================================================
router.use(protect); // Ensure user is authenticated
router.use(aiLimiter); // Apply AI-specific rate limiting

// ============================================================
// Validation Rules
// ============================================================

/**
 * Validation rules for interview question generation
 * - topic: Required, the subject area for questions (e.g., 'JavaScript', 'Data Structures')
 * - difficulty: Optional, defaults in controller (easy/medium/hard)
 * - count: Optional, number of questions to generate (1-20)
 */
const interviewQuestionsValidation = [
  body('topic')
    .trim()
    .notEmpty()
    .withMessage('Topic is required for generating interview questions')
    .isLength({ min: 2, max: 100 })
    .withMessage('Topic must be between 2 and 100 characters'),

  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard'),

  body('count')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Count must be between 1 and 20')
];

/**
 * Validation rules for resume analysis
 * - resumeText: Required, the full text content of the resume
 *   Max length 10,000 characters to prevent excessively long API calls
 */
const resumeAnalyzeValidation = [
  body('resumeText')
    .trim()
    .notEmpty()
    .withMessage('Resume text is required for analysis')
    .isLength({ min: 50, max: 10000 })
    .withMessage('Resume text must be between 50 and 10,000 characters')
];

/**
 * Validation rules for career recommendation
 * - skills: Optional array of user's current skills
 * - interests: Optional array of user's interests
 * - experience: Optional string describing experience level
 */
const careerRecommendationValidation = [
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),

  body('interests')
    .optional()
    .isArray()
    .withMessage('Interests must be an array'),

  body('experience')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Experience description cannot exceed 500 characters')
];

/**
 * Validation rules for AI chat
 * - message: Required, the user's chat message
 * - context: Optional array of previous messages for conversation continuity
 */
const chatValidation = [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2,000 characters'),

  body('context')
    .optional()
    .isArray()
    .withMessage('Context must be an array of previous messages')
];

// ============================================================
// Route Definitions
// ============================================================

/**
 * @route   POST /api/ai/interview-questions
 * @desc    Generate AI-powered interview questions for a specific topic
 * @access  Private + Rate Limited
 * @body    { topic: string, difficulty?: 'easy'|'medium'|'hard', count?: number }
 * @returns { success: true, data: { questions: [{ question, expectedAnswer, tips }] } }
 * 
 * @example
 * POST /api/ai/interview-questions
 * Body: { "topic": "React.js", "difficulty": "medium", "count": 5 }
 */
router.post(
  '/interview-questions',
  interviewQuestionsValidation,
  validate,
  generateInterviewQuestions
);

/**
 * @route   POST /api/ai/resume-analyze
 * @desc    Analyze a resume using AI and provide improvement suggestions
 * @access  Private + Rate Limited
 * @body    { resumeText: string }
 * @returns { success: true, data: { scores, strengths, improvements, suggestions } }
 * 
 * @note    Resume text should be extracted from the PDF/document on the client side
 *          and sent as plain text. The AI will analyze formatting based on text structure.
 */
router.post(
  '/resume-analyze',
  resumeAnalyzeValidation,
  validate,
  analyzeResume
);

/**
 * @route   POST /api/ai/career-recommendation
 * @desc    Get personalized career path recommendations based on user profile
 * @access  Private + Rate Limited
 * @body    { skills?: string[], interests?: string[], experience?: string }
 * @returns { success: true, data: { careerPaths, companies, skillsToLearn } }
 * 
 * @note    The AI also considers the user's test results and course history
 *          stored in the database for more personalized recommendations.
 */
router.post(
  '/career-recommendation',
  careerRecommendationValidation,
  validate,
  getCareerRecommendation
);

/**
 * @route   POST /api/ai/chat
 * @desc    Chat with the AI learning and placement assistant
 * @access  Private + Rate Limited
 * @body    { message: string, context?: array }
 * @returns { success: true, data: { reply: string } }
 * 
 * @note    The AI is configured with a system prompt that makes it behave as a
 *          knowledgeable learning and placement preparation assistant.
 *          Context array allows multi-turn conversations.
 */
router.post(
  '/chat',
  chatValidation,
  validate,
  chatWithAI
);

/**
 * @route   GET /api/ai/placement-roadmap
 * @desc    Generate a personalized week-by-week placement preparation roadmap
 * @access  Private + Rate Limited
 * @returns { success: true, data: { roadmap: [{ week, goals, tasks, resources }] } }
 * 
 * @note    The roadmap is generated based on the user's current skill level,
 *          test performance, and target companies/roles from their profile.
 *          This is a GET request as it uses existing user data (no body needed).
 */
router.get('/placement-roadmap', getPlacementRoadmap);

// Export the router for mounting in the main Express app
module.exports = router;
