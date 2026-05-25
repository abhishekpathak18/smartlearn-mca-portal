/**
 * ============================================================
 * Express Application Setup - Main Application Configuration
 * ============================================================
 * 
 * This is the core Express application file that:
 * 1. Initializes the Express app instance
 * 2. Configures global middleware (security, parsing, logging)
 * 3. Mounts all API route handlers
 * 4. Sets up static file serving for uploads
 * 5. Registers the global error handler
 * 
 * This file does NOT start the server — that's done in server.js.
 * This separation follows the Single Responsibility Principle and
 * makes the app easier to test (you can import the app without
 * starting the server).
 * 
 * Architecture: Routes → Controllers → Services → Models
 * 
 * @module app
 * @requires express
 * @requires cors
 * @requires helmet
 * @requires morgan
 * @requires cookie-parser
 * @requires path
 * ============================================================
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

// ============================================================
// Import Route Files
// ============================================================
// Each route file handles a specific group of related endpoints.
// They are mounted on specific URL prefixes below.

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const testRoutes = require('./routes/testRoutes');
const resultRoutes = require('./routes/resultRoutes');
const aiRoutes = require('./routes/aiRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminRoutes = require('./routes/adminRoutes');

// ============================================================
// Import Middleware
// ============================================================

const errorHandler = require('./middleware/errorHandler');
const { generalLimiter, authLimiter, aiLimiter } = require('./middleware/rateLimiter');

// ============================================================
// Create Express Application
// ============================================================
// express() returns an Express application object that we
// configure with middleware and routes below.

const app = express();

// ============================================================
// Global Middleware Configuration
// ============================================================
// Middleware functions execute in the ORDER they are registered.
// Security middleware runs first, then parsing, then logging.

/**
 * 1. Helmet - Security Headers
 * ============================================================
 * Helmet sets various HTTP security headers to protect against
 * common web vulnerabilities:
 * - X-Content-Type-Options: nosniff (prevents MIME type sniffing)
 * - X-Frame-Options: DENY (prevents clickjacking)
 * - Strict-Transport-Security (enforces HTTPS)
 * - X-XSS-Protection (legacy XSS protection)
 * - Content-Security-Policy (controls resource loading)
 */
app.use(helmet());

/**
 * 2. CORS - Cross-Origin Resource Sharing
 * ============================================================
 * CORS configuration allows our frontend (running on CLIENT_URL)
 * to make API requests to this backend server.
 * 
 * - origin: Only allows requests from CLIENT_URL (e.g., http://localhost:3000)
 * - credentials: true allows cookies to be sent with cross-origin requests
 *   (needed for cookie-based JWT authentication)
 * - methods: Allowed HTTP methods
 * - allowedHeaders: Headers the client can send
 */
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.CLIENT_URL,
    ].filter(Boolean);
    
    // Allow any netlify.app subdomain automatically
    if (origin.includes('.netlify.app') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // In development, allow everything
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/**
 * 3. Morgan - HTTP Request Logger
 * ============================================================
 * Morgan logs incoming HTTP requests to the console.
 * 'dev' format outputs: :method :url :status :response-time ms
 * Example: GET /api/courses 200 12.345 ms
 * 
 * Only enabled in development mode to avoid noisy production logs.
 */
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

/**
 * 4. Body Parsers - JSON and URL-encoded
 * ============================================================
 * express.json() parses incoming JSON request bodies.
 * Limit is set to 10mb to handle large payloads like:
 * - Resume text content
 * - AI-generated content
 * - Bulk data imports
 * 
 * express.urlencoded() parses URL-encoded form data.
 * extended: true allows for rich objects and arrays.
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * 5. Cookie Parser
 * ============================================================
 * Parses cookies attached to the client request.
 * Populates req.cookies with cookie name-value pairs.
 * Used by the auth middleware to extract JWT from cookies.
 */
app.use(cookieParser());

// ============================================================
// Static File Serving
// ============================================================
// Serve uploaded files (resumes, profile pictures, etc.)
// Files in the 'uploads' directory are accessible via /uploads URL
// Example: /uploads/resumes/resume-12345.pdf

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============================================================
// API Health Check Route
// ============================================================
// A simple endpoint to verify the server is running.
// Useful for monitoring services and load balancers.

/**
 * @route   GET /api/health
 * @desc    Health check endpoint - verify server is running
 * @access  Public
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart Learning Portal API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// ============================================================
// Mount API Routes with Rate Limiters
// ============================================================
// Each route group is mounted on a specific URL prefix.
// Rate limiters are applied to route groups based on sensitivity:
// - authLimiter: Strict limiting for authentication routes
// - aiLimiter: Moderate limiting for AI-powered routes
// - generalLimiter: Standard limiting for all other routes

/**
 * Authentication Routes - /api/auth
 * Handles: register, login, logout, forgot-password, reset-password
 * Rate Limited: Strict (10 req/15min) to prevent brute force attacks
 */
app.use('/api/auth', authLimiter, authRoutes);

/**
 * User Routes - /api/users
 * Handles: profile, update profile, change password, user preferences
 */
app.use('/api/users', generalLimiter, userRoutes);

/**
 * Course Routes - /api/courses
 * Handles: CRUD operations for courses, enrollment, progress tracking
 */
app.use('/api/courses', generalLimiter, courseRoutes);

/**
 * Test Routes - /api/tests
 * Handles: CRUD for tests/quizzes, question management, test attempts
 */
app.use('/api/tests', generalLimiter, testRoutes);

/**
 * Result Routes - /api/results
 * Handles: Test results, score history, performance analytics
 */
app.use('/api/results', generalLimiter, resultRoutes);

/**
 * AI Routes - /api/ai
 * Handles: AI quiz generation, learning recommendations, content analysis
 * Rate Limited: Moderate (20 req/15min) to control Gemini API costs
 */
app.use('/api/ai', aiLimiter, aiRoutes);

/**
 * Resume Routes - /api/resume
 * Handles: Resume upload, AI analysis, PDF generation, templates
 * Rate Limited: Moderate (20 req/15min) for AI-powered analysis
 */
app.use('/api/resume', aiLimiter, resumeRoutes);

/**
 * Notification Routes - /api/notifications
 * Handles: User notifications, read/unread status, notification preferences
 */
app.use('/api/notifications', generalLimiter, notificationRoutes);

/**
 * Analytics Routes - /api/analytics
 * Handles: Learning analytics, progress reports, performance dashboards
 */
app.use('/api/analytics', generalLimiter, analyticsRoutes);

/**
 * Admin Routes - /api/admin
 * Handles: User management, system analytics, content moderation
 */
app.use('/api/admin', generalLimiter, adminRoutes);

// ============================================================
// 404 Handler - Route Not Found
// ============================================================
// This middleware catches requests to routes that don't exist.
// It must be placed AFTER all route definitions but BEFORE
// the error handler.

app.use('/{*path}', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// ============================================================
// Global Error Handler
// ============================================================
// This MUST be the LAST middleware registered.
// It catches all errors from route handlers and middleware.
// Express identifies it as error middleware by its 4-parameter signature.

app.use(errorHandler);

// ============================================================
// Export the Express App
// ============================================================
// The app is exported (not started here) so that:
// 1. server.js can start it after connecting to the database
// 2. Test files can import it without starting the server

module.exports = app;
