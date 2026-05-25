/**
 * ============================================================================
 * USER CONTROLLER - Smart Learning & Placement Preparation Portal
 * ============================================================================
 * 
 * This controller manages user profile operations:
 * - View user profile
 * - Update user profile (name, email, bio, skills, etc.)
 * - Upload/update avatar image
 * - Get user analytics (dashboard data)
 * - Update password (while logged in)
 * 
 * All endpoints require authentication (user must be logged in).
 * The authenticated user's ID is available via req.user.id,
 * set by the auth middleware.
 * 
 * @module controllers/userController
 * @requires mongoose models: User, Result, Course
 * @requires bcryptjs for password operations
 * ============================================================================
 */

// ─── Module Imports ─────────────────────────────────────────────────────────────
const User = require('../models/User');         // User model for profile operations
const Result = require('../models/Result');     // Result model for analytics
const Course = require('../models/Course');     // Course model for enrollment stats
const bcrypt = require('bcryptjs');             // Password hashing for password update

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Get the logged-in user's full profile
 * @route   GET /api/users/profile
 * @access  Private (requires authentication)
 * 
 * Returns the complete user profile including all fields except password.
 * This is different from auth/getMe in that it may include additional
 * computed fields like course count and test stats.
 * 
 * @param {Object} req - Express request object (req.user set by auth middleware)
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with user profile data
 */
const getProfile = async (req, res) => {
  try {
    // Find the user by their ID from the JWT token (set by auth middleware)
    // Password is excluded by default due to select: false in the schema
    const user = await User.findById(req.user.id);

    // Safety check: user should exist since they passed auth middleware
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
    }

    // Count additional stats for the profile response
    // These provide useful context on the user's dashboard
    const [enrolledCoursesCount, totalTestsTaken] = await Promise.all([
      // Count courses where this user is enrolled
      Course.countDocuments({ enrolledStudents: req.user.id }),
      // Count total test results for this user
      Result.countDocuments({ user: req.user.id })
    ]);

    res.status(200).json({
      success: true,
      data: {
        user,
        stats: {
          enrolledCourses: enrolledCoursesCount,
          testsTaken: totalTestsTaken
        }
      }
    });

  } catch (error) {
    console.error('[USER] Get profile error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching profile'
    });
  }
};

/**
 * @desc    Update the logged-in user's profile information
 * @route   PUT /api/users/profile
 * @access  Private (requires authentication)
 * 
 * Allows users to update their profile fields. Only whitelisted fields
 * can be updated to prevent mass-assignment attacks (e.g., a user trying
 * to change their role to 'admin').
 * 
 * Whitelisted fields: name, email, bio, skills, education, experience
 * Blocked fields: role, password, isActive (use dedicated endpoints)
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.body - Fields to update
 * @param {string} [req.body.name] - Updated name
 * @param {string} [req.body.email] - Updated email
 * @param {string} [req.body.bio] - Updated biography
 * @param {Array<string>} [req.body.skills] - Updated skills array
 * @param {string} [req.body.education] - Updated education info
 * @param {string} [req.body.experience] - Updated experience info
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated user data
 */
const updateProfile = async (req, res) => {
  try {
    // Step 1: Define which fields are allowed to be updated
    // This is a security measure to prevent mass-assignment attacks
    // For example, a malicious user could try to set role: 'admin'
    const allowedFields = ['name', 'email', 'bio', 'skills', 'phone', 'university', 'department', 'semester'];

    // Step 2: Build an object with only the allowed fields from the request body
    const updateData = {};
    allowedFields.forEach(field => {
      // Only include fields that are actually present in the request body
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Step 3: Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields provided for update'
      });
    }

    // Step 4: If email is being updated, check for duplicates
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase();
      const existingUser = await User.findOne({
        email: updateData.email,
        _id: { $ne: req.user.id }  // Exclude current user from duplicate check
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'This email is already associated with another account'
        });
      }
    }

    // Step 5: Update the user document
    // findByIdAndUpdate options:
    // - new: true → Returns the modified document rather than the original
    // - runValidators: true → Runs schema validators on the update
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      {
        new: true,              // Return the updated document
        runValidators: true     // Apply schema validations
      }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Step 6: Log the profile update
    console.log(`[USER] Profile updated for user: ${updatedUser.email}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('[USER] Update profile error:', error.message);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error while updating profile'
    });
  }
};

/**
 * @desc    Upload or update user's avatar/profile picture
 * @route   PUT /api/users/avatar
 * @access  Private (requires authentication)
 * 
 * This endpoint expects a file upload handled by Multer middleware.
 * The Multer middleware processes the file BEFORE this controller runs,
 * saving the file to disk and adding file info to req.file.
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.file - Multer file object (populated by multer middleware)
 * @param {string} req.file.filename - The saved filename on disk
 * @param {string} req.file.path - Full path to the saved file
 * @param {number} req.file.size - File size in bytes
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with the avatar URL
 */
const uploadAvatar = async (req, res) => {
  try {
    // Step 1: Check if a file was uploaded
    // Multer populates req.file when a single file is uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload an image file'
      });
    }

    // Step 2: Build the avatar URL path
    // This path is relative to the server's public directory
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Step 3: Update the user's avatar field in the database
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }       // Return updated document
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log(`[USER] Avatar uploaded for user: ${user.email} → ${avatarUrl}`);

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatar: avatarUrl
      }
    });

  } catch (error) {
    console.error('[USER] Avatar upload error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error while uploading avatar'
    });
  }
};

/**
 * @desc    Get comprehensive analytics for the logged-in user's dashboard
 * @route   GET /api/users/analytics
 * @access  Private (requires authentication)
 * 
 * Aggregates data from multiple collections to build a complete
 * dashboard overview including:
 * - Total tests taken and average score
 * - Courses enrolled and completed
 * - Recent activity / test results
 * - Performance breakdown by category
 * 
 * Uses MongoDB aggregation pipeline for efficient data processing
 * on the database server rather than in application code.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with aggregated analytics data
 */
const getUserAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    // ── Run multiple queries in parallel for performance ──
    // Promise.all executes all promises concurrently, which is faster
    // than running them sequentially (one after another)
    const [
      totalResults,
      scoreAggregation,
      enrolledCourses,
      recentResults,
      categoryBreakdown
    ] = await Promise.all([

      // Query 1: Count total test results for this user
      Result.countDocuments({ user: userId }),

      // Query 2: Calculate average score using MongoDB aggregation
      // Aggregation pipeline processes documents through stages
      Result.aggregate([
        { $match: { user: userId } },                          // Stage 1: Filter by user
        {
          $group: {                                             // Stage 2: Group and calculate
            _id: null,                                         // Group all documents together
            averageScore: { $avg: '$percentage' },             // Calculate average of 'percentage' field
            highestScore: { $max: '$percentage' },             // Find the maximum score
            lowestScore: { $min: '$percentage' },              // Find the minimum score
            totalScore: { $sum: '$score' }                     // Sum of all scores
          }
        }
      ]),

      // Query 3: Count enrolled courses
      Course.countDocuments({ enrolledStudents: userId }),

      // Query 4: Get 5 most recent test results for activity feed
      Result.find({ user: userId })
        .sort({ createdAt: -1 })         // Sort by newest first
        .limit(5)                         // Only get last 5
        .populate('test', 'title category'), // Include test title and category

      // Query 5: Break down results by category (topic strengths)
      Result.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: '$category',                                   // Group by test category
            avgScore: { $avg: '$percentage' },                 // Average score per category
            count: { $sum: 1 },                                // Count of tests per category
            highestScore: { $max: '$percentage' }              // Best score per category
          }
        },
        { $sort: { avgScore: -1 } }                            // Sort by average score descending
      ])
    ]);

    // ── Build the analytics response ──
    // Extract aggregation results (returns array, we need first element)
    const scores = scoreAggregation[0] || {
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      totalScore: 0
    };

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalTestsTaken: totalResults,
          averageScore: Math.round(scores.averageScore * 100) / 100,  // Round to 2 decimal places
          highestScore: scores.highestScore,
          lowestScore: scores.lowestScore,
          enrolledCourses
        },
        recentActivity: recentResults,
        categoryBreakdown
      }
    });

  } catch (error) {
    console.error('[USER] Get analytics error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching analytics'
    });
  }
};

/**
 * @desc    Update the logged-in user's password
 * @route   PUT /api/users/password
 * @access  Private (requires authentication)
 * 
 * Requires the user to provide their current password for verification
 * before setting a new password. This prevents unauthorized password changes
 * if someone gains access to an active session.
 * 
 * Flow:
 * 1. Validate current and new passwords are provided
 * 2. Fetch user with password field included
 * 3. Verify current password matches
 * 4. Set new password (will be hashed by pre-save middleware)
 * 5. Save and respond
 * 
 * @param {Object} req - Express request object
 * @param {string} req.body.currentPassword - User's current password for verification
 * @param {string} req.body.newPassword - The new password to set
 * @param {Object} res - Express response object
 * @returns {Object} JSON response confirming password update
 */
const updatePassword = async (req, res) => {
  try {
    // Step 1: Extract passwords from request body
    const { currentPassword, newPassword } = req.body;

    // Step 2: Validate both fields are provided
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both current password and new password'
      });
    }

    // Step 3: Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long'
      });
    }

    // Step 4: Fetch user with password field included
    // We need the password to verify the current password
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Step 5: Verify the current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Step 6: Set the new password
    // The User model's pre-save middleware will hash this automatically
    user.password = newPassword;

    // Step 7: Save the user (triggers password hashing)
    await user.save();

    console.log(`[USER] Password updated for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('[USER] Update password error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error while updating password'
    });
  }
};

// ─── Export All Controller Functions ────────────────────────────────────────────
module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  getUserAnalytics,
  updatePassword
};
