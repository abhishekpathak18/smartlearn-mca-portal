/**
 * ============================================================
 * Rate Limiter Middleware Configuration
 * ============================================================
 * 
 * This module configures rate limiters using express-rate-limit
 * to prevent abuse and protect the API from:
 * - Brute force attacks on authentication endpoints
 * - DDoS (Distributed Denial of Service) attacks
 * - API abuse and excessive requests
 * - Expensive AI API call abuse (Google Gemini)
 * 
 * Three different rate limiters are configured for different
 * route groups, each with appropriate limits:
 * 
 * 1. generalLimiter  - General API routes (100 req / 15 min)
 * 2. authLimiter     - Authentication routes (10 req / 15 min)
 * 3. aiLimiter       - AI-powered routes (20 req / 15 min)
 * 
 * How Rate Limiting Works:
 * - Each client is identified by their IP address
 * - A sliding window counter tracks requests per IP
 * - When the limit is exceeded, a 429 (Too Many Requests) is returned
 * - The counter resets after the window period expires
 * 
 * @module middleware/rateLimiter
 * @requires express-rate-limit
 * ============================================================
 */

const rateLimit = require('express-rate-limit');

// ============================================================
// General Rate Limiter
// ============================================================
// Applied to all general API routes (courses, tests, results, etc.)
// Allows 100 requests per 15-minute window per IP address.
// This is generous enough for normal usage but prevents abuse.

/**
 * General purpose rate limiter for standard API endpoints.
 * 
 * Configuration:
 * - Window: 15 minutes (900,000 ms)
 * - Max requests: 100 per window per IP
 * - Applied to: /api/courses, /api/tests, /api/results, etc.
 * 
 * @type {import('express-rate-limit').RateLimitRequestHandler}
 * 
 * @example
 * // Apply to all routes in app.js
 * app.use('/api', generalLimiter);
 * 
 * // Or apply to specific route groups
 * app.use('/api/courses', generalLimiter, courseRoutes);
 */
const generalLimiter = rateLimit({
  // Time window in milliseconds (15 minutes)
  windowMs: 15 * 60 * 1000,

  // Maximum number of requests allowed per window per IP
  max: 100,

  // Response message when rate limit is exceeded
  message: {
    success: false,
    message: 'Too many requests from this IP address. Please try again after 15 minutes.',
    retryAfter: '15 minutes'
  },

  // Return rate limit info in the `RateLimit-*` headers
  // Helps clients track their remaining requests
  standardHeaders: true,

  // Disable the `X-RateLimit-*` headers (use standard headers instead)
  legacyHeaders: false,

  // Skip rate limiting for successful requests in development
  // (uncomment below line if needed during development)
  // skip: (req, res) => process.env.NODE_ENV === 'development',
});

// ============================================================
// Authentication Rate Limiter (Strict)
// ============================================================
// Applied to authentication routes (login, register, password reset).
// Very restrictive to prevent brute force attacks on user accounts.
// Only allows 10 requests per 15-minute window per IP.

/**
 * Strict rate limiter for authentication endpoints.
 * 
 * Configuration:
 * - Window: 15 minutes (900,000 ms)
 * - Max requests: 10 per window per IP
 * - Applied to: /api/auth/login, /api/auth/register, /api/auth/forgot-password
 * 
 * Why so strict?
 * - Prevents brute force password guessing attacks
 * - 10 attempts in 15 minutes is more than enough for legitimate users
 * - Attackers trying to crack passwords need thousands of attempts
 * 
 * @type {import('express-rate-limit').RateLimitRequestHandler}
 */
const authLimiter = rateLimit({
  // Time window in milliseconds (15 minutes)
  windowMs: 15 * 60 * 1000,

  // Maximum number of requests allowed per window per IP
  // 10 is strict but prevents brute force attacks
  max: 10,

  // Custom error message for auth rate limiting
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
    retryAfter: '15 minutes'
  },

  // Return rate limit info in standard headers
  standardHeaders: true,
  legacyHeaders: false,

  // Skip successful requests - only count failed attempts
  // This way, successful logins don't count against the limit
  // skipSuccessfulRequests: true, // Uncomment to enable
});

// ============================================================
// AI Route Rate Limiter
// ============================================================
// Applied to AI-powered routes (quiz generation, resume analysis, etc.)
// More restrictive than general routes because:
// 1. Gemini API calls are expensive (cost per token)
// 2. AI responses take longer to generate (server resource usage)
// 3. Each AI call consumes significant compute resources

/**
 * Rate limiter for AI-powered endpoints.
 * 
 * Configuration:
 * - Window: 15 minutes (900,000 ms)
 * - Max requests: 20 per window per IP
 * - Applied to: /api/ai/*, /api/resume/analyze
 * 
 * Why restrict AI endpoints more?
 * - Each Gemini API call costs money (token-based pricing)
 * - AI generation is CPU/memory intensive on the server
 * - Prevents a single user from exhausting the AI budget
 * - 20 requests per 15 minutes is generous for legitimate study use
 * 
 * @type {import('express-rate-limit').RateLimitRequestHandler}
 */
const aiLimiter = rateLimit({
  // Time window in milliseconds (15 minutes)
  windowMs: 15 * 60 * 1000,

  // Maximum number of AI requests allowed per window per IP
  max: 20,

  // Custom error message for AI rate limiting
  message: {
    success: false,
    message: 'Too many AI requests. Please wait before generating more content. Try again after 15 minutes.',
    retryAfter: '15 minutes'
  },

  // Return rate limit info in standard headers
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================
// Export all rate limiters
// ============================================================
// Each limiter is used in app.js when mounting route groups

module.exports = {
  generalLimiter,
  authLimiter,
  aiLimiter
};
