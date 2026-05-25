/**
 * @fileoverview User Profile Routes
 * 
 * This file defines all user profile management API routes for the Smart Learning Portal.
 * All routes in this file require authentication (JWT token).
 * Handles profile viewing/editing, avatar uploads, analytics, and password changes.
 * 
 * Route Prefix: /api/users
 * 
 * @module routes/userRoutes
 * @requires express
 * @requires express-validator
 * @requires multer
 * @requires path
 * @requires ../controllers/userController
 * @requires ../middleware/auth
 * @requires ../middleware/validate
 */

const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');

// ============================================================
// Import Controller Functions
// Each function handles the business logic for its respective route
// ============================================================
const {
  getProfile,
  updateProfile,
  uploadAvatar,
  getUserAnalytics,
  updatePassword
} = require('../controllers/userController');

// ============================================================
// Import Middleware
// - protect: Ensures user is authenticated via JWT token
// - validate: Processes express-validator results
// ============================================================
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// ============================================================
// Multer Configuration for Avatar Uploads
// Configures disk storage with custom filename generation
// and file type filtering (images only)
// ============================================================

/**
 * Multer disk storage configuration
 * - destination: Stores avatars in the 'uploads/avatars/' directory
 * - filename: Generates unique filenames using userId + timestamp + extension
 *   Example: user-60d21b4667d0d8c4f8b4e1a2-1622505600000.jpg
 */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Store uploaded avatars in the uploads/avatars directory
    cb(null, path.join(__dirname, '../../uploads/avatars'));
  },
  filename: function (req, file, cb) {
    // Create unique filename: user-<userId>-<timestamp>.<extension>
    // This prevents filename collisions and organizes files by user
    const uniqueName = `user-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

/**
 * File filter function for multer
 * Only allows image file types (JPEG, JPG, PNG, GIF, WebP)
 * Rejects all other file types with an error message
 * 
 * @param {Object} req - Express request object
 * @param {Object} file - Uploaded file object from multer
 * @param {Function} cb - Callback function (error, accept)
 */
const fileFilter = (req, file, cb) => {
  // Define allowed MIME types for avatar images
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    // Accept the file - passes true to the callback
    cb(null, true);
  } else {
    // Reject the file with a descriptive error message
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
  }
};

/**
 * Multer upload instance configured with:
 * - Custom disk storage (uploads/avatars directory)
 * - 5MB file size limit to prevent abuse
 * - Image-only file filter for security
 */
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size for avatars
  },
  fileFilter: fileFilter
});

// ============================================================
// Create Express Router Instance
// This router will be mounted at /api/users in the main app
// ============================================================
const router = express.Router();

// ============================================================
// Apply Authentication Middleware to ALL Routes
// Every route in this file requires a valid JWT token.
// router.use() applies middleware to all subsequent routes.
// ============================================================
router.use(protect);

// ============================================================
// Validation Rules
// ============================================================

/**
 * Validation rules for profile update
 * All fields are optional - users can update any combination
 * - name: If provided, must be 2-50 characters
 * - email: If provided, must be valid email format
 * - phone: If provided, must be a valid mobile number
 * - bio: If provided, max 500 characters
 */
const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('phone')
    .optional()
    .trim()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters')
];

/**
 * Validation rules for password change
 * - currentPassword: Required to verify identity before change
 * - newPassword: Required, minimum 6 characters for security
 * - confirmPassword: Required, must match newPassword exactly
 */
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your new password')
    .custom((value, { req }) => {
      // Custom validator to ensure password confirmation matches
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

// ============================================================
// Route Definitions
// ============================================================

/**
 * @route   GET /api/users/profile
 * @desc    Get the authenticated user's full profile details
 * @access  Private
 * @returns { success: true, data: { user } }
 */
router.get('/profile', getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update the authenticated user's profile information
 * @access  Private
 * @body    { name?: string, email?: string, phone?: string, bio?: string, skills?: array }
 * @returns { success: true, data: { user } }
 */
router.put('/profile', updateProfileValidation, validate, updateProfile);

/**
 * @route   PUT /api/users/avatar
 * @desc    Upload or update the user's profile avatar image
 * @access  Private
 * @body    FormData with 'avatar' field containing image file
 * @note    Max file size: 5MB. Allowed types: JPEG, PNG, GIF, WebP
 * @returns { success: true, data: { avatarUrl } }
 */
router.put('/avatar', upload.single('avatar'), uploadAvatar);

/**
 * @route   GET /api/users/analytics
 * @desc    Get the authenticated user's learning analytics and progress
 * @access  Private
 * @returns { success: true, data: { analytics } }
 */
router.get('/analytics', getUserAnalytics);

/**
 * @route   PUT /api/users/password
 * @desc    Change the authenticated user's password
 * @access  Private
 * @body    { currentPassword: string, newPassword: string, confirmPassword: string }
 * @returns { success: true, message: 'Password updated successfully' }
 */
router.put('/password', changePasswordValidation, validate, updatePassword);

// Export the router for mounting in the main Express app
module.exports = router;
