/**
 * @fileoverview Authentication Routes
 * 
 * This file defines all authentication-related API routes for the Smart Learning Portal.
 * Routes handle user registration, login, password management, and session management.
 * 
 * Route Prefix: /api/auth
 * 
 * @module routes/authRoutes
 * @requires express
 * @requires express-validator
 * @requires ../controllers/authController
 * @requires ../middleware/auth
 */

const express = require('express');
const { body } = require('express-validator');

// ============================================================
// Import Controller Functions
// Each controller function handles the business logic for its route
// ============================================================
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  logout
} = require('../controllers/authController');

// ============================================================
// Import Middleware
// - protect: Ensures the user is authenticated via JWT
// - validate: Runs express-validator checks and returns errors if any
// ============================================================
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// ============================================================
// Create Express Router Instance
// This router will be mounted at /api/auth in the main app
// ============================================================
const router = express.Router();

// ============================================================
// Validation Rules
// Reusable arrays of express-validator checks for each route.
// These are defined separately for clarity and reusability.
// ============================================================

/**
 * Validation rules for user registration
 * - name: Required, trimmed, between 2-50 characters
 * - email: Required, must be a valid email format, normalized
 * - password: Required, minimum 6 characters for security
 */
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

/**
 * Validation rules for user login
 * - email: Required, must be a valid email
 * - password: Required, cannot be empty
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Validation rules for forgot password
 * - email: Required, must be a valid email to send reset link
 */
const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
];

/**
 * Validation rules for reset password
 * - password: Required, minimum 6 characters
 * - confirmPassword: Required, must match password field
 */
const resetPasswordValidation = [
  body('password')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your password')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

// ============================================================
// Route Definitions
// ============================================================

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account
 * @access  Public
 * @body    { name: string, email: string, password: string }
 * @returns { success: true, data: { user, token } }
 */
router.post('/register', registerValidation, validate, register);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT token
 * @access  Public
 * @body    { email: string, password: string }
 * @returns { success: true, data: { user, token } }
 */
router.post('/login', loginValidation, validate, login);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email with token
 * @access  Public
 * @body    { email: string }
 * @returns { success: true, message: 'Password reset email sent' }
 */
router.post('/forgot-password', forgotPasswordValidation, validate, forgotPassword);

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Reset user password using the reset token from email
 * @access  Public (requires valid reset token)
 * @param   {string} token - Password reset token from the email link
 * @body    { password: string, confirmPassword: string }
 * @returns { success: true, message: 'Password reset successful' }
 */
router.post('/reset-password/:token', resetPasswordValidation, validate, resetPassword);

/**
 * @route   GET /api/auth/me
 * @desc    Get the currently authenticated user's profile
 * @access  Private (requires valid JWT)
 * @returns { success: true, data: { user } }
 */
router.get('/me', protect, getMe);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user by clearing the auth cookie
 * @access  Public (clears cookie regardless of auth state)
 * @returns { success: true, message: 'Logged out successfully' }
 */
router.post('/logout', logout);

// Export the router for mounting in the main Express app
module.exports = router;
