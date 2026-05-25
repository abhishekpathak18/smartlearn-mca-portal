/**
 * ============================================================================
 * ADMIN CONTROLLER - Smart Learning & Placement Preparation Portal
 * ============================================================================
 * 
 * This controller handles all admin-level operations for platform management:
 * 
 * Dashboard & Analytics:
 * - getDashboardStats: Overview counts, recent registrations, avg scores
 * - getPlatformAnalytics: Deep platform-wide statistics and trends
 * - getActivityLogs: Paginated, filterable activity/audit logs
 * 
 * User Management:
 * - getAllUsers: Paginated user list with search and role filter
 * - updateUser: Update any user's profile (including role, status)
 * - deleteUser: Soft-delete or permanent delete a user
 * 
 * Course Management:
 * - createCourse: Create a new course with modules
 * - updateCourse: Update course details and modules
 * - deleteCourse: Remove a course from the platform
 * 
 * Test Management:
 * - createTest: Create a test with questions and answers
 * - updateTest: Update test details and questions
 * - deleteTest: Remove a test from the platform
 * 
 * ALL admin endpoints require:
 * 1. Authentication (valid JWT token)
 * 2. Authorization (user role must be 'admin')
 * These checks are handled by auth and role middleware in the routes.
 * 
 * @module controllers/adminController
 * @requires mongoose models: User, Course, Test, Result, Notification
 * ============================================================================
 */

// ─── Module Imports ─────────────────────────────────────────────────────────────
const User = require('../models/User');               // User model
const Course = require('../models/Course');             // Course model
const Test = require('../models/Test');                 // Test model
const Result = require('../models/Result');             // Result model
const Notification = require('../models/Notification'); // Notification model
const mongoose = require('mongoose');                   // Mongoose for ObjectId & aggregation

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD & ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Get admin dashboard overview statistics
 * @route   GET /api/admin/dashboard
 * @access  Private/Admin
 * 
 * Returns a high-level summary of the entire platform:
 * - Total counts (users, courses, tests, results)
 * - Recent registrations (last 7 days)
 * - Average test score across all users
 * - User distribution by role
 * - Recent activity feed
 * 
 * This data powers the admin dashboard's summary cards and charts.
 * All queries run in parallel for optimal performance.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with dashboard statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    // Calculate the date 7 days ago (for recent registrations)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    // Calculate 30 days ago (for trends)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // ── Run all queries concurrently using Promise.all ──
    const [
      totalUsers,
      totalCourses,
      totalTests,
      totalResults,
      recentRegistrations,
      avgScoreResult,
      usersByRole,
      recentResults
    ] = await Promise.all([
      // Count total documents in each collection
      User.countDocuments(),
      Course.countDocuments(),
      Test.countDocuments(),
      Result.countDocuments(),

      // Count users registered in the last 7 days
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),

      // Calculate platform-wide average test score
      Result.aggregate([
        {
          $group: {
            _id: null,
            avgScore: { $avg: '$percentage' },
            totalTestsTaken: { $sum: 1 }
          }
        }
      ]),

      // Distribution of users by role (student, admin, etc.)
      User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),

      // 10 most recent test results (activity feed)
      Result.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('user', 'name email')
        .populate('test', 'title')
        .select('percentage passed createdAt')
        .lean()
    ]);

    // ── Process aggregation results ──
    const avgScore = avgScoreResult[0] || { avgScore: 0, totalTestsTaken: 0 };

    // Transform usersByRole into a more readable format
    const roleDistribution = {};
    usersByRole.forEach(role => {
      roleDistribution[role._id || 'unknown'] = role.count;
    });

    // ── Build response ──
    res.status(200).json({
      success: true,
      data: {
        // Summary cards data
        counts: {
          totalUsers,
          totalCourses,
          totalTests,
          totalResults
        },
        // Recent activity metrics
        recent: {
          newRegistrations: recentRegistrations,
          periodLabel: 'Last 7 days'
        },
        // Performance metrics
        performance: {
          platformAvgScore: Math.round(avgScore.avgScore * 100) / 100,
          totalTestsTaken: avgScore.totalTestsTaken
        },
        // User distribution
        usersByRole: roleDistribution,
        // Recent activity feed
        recentActivity: recentResults
      }
    });

  } catch (error) {
    console.error('[ADMIN] Dashboard stats error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching dashboard statistics'
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// USER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Get all users with pagination, search, and role filter
 * @route   GET /api/admin/users
 * @access  Private/Admin
 * 
 * Returns a paginated list of all platform users with filtering:
 * - search: Case-insensitive search in name and email
 * - role: Filter by user role (student, admin)
 * - status: Filter by active/inactive status
 * - sort: Sort field with direction (e.g., '-createdAt')
 * 
 * @param {Object} req - Express request object
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=20] - Users per page
 * @param {string} [req.query.search] - Search term for name/email
 * @param {string} [req.query.role] - Filter by role
 * @param {string} [req.query.sort] - Sort field
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with paginated users list
 */
const getAllUsers = async (req, res) => {
  try {
    // ── Parse query parameters ──
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    // ── Build filter query ──
    const filterQuery = {};

    // Search: Match against name OR email using case-insensitive regex
    if (req.query.search) {
      filterQuery.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Filter by role
    if (req.query.role) {
      filterQuery.role = req.query.role;
    }

    // Filter by active status
    if (req.query.status === 'active') {
      filterQuery.isActive = true;
    } else if (req.query.status === 'inactive') {
      filterQuery.isActive = false;
    }

    // ── Build sort query ──
    let sortQuery = { createdAt: -1 }; // Default: newest first
    if (req.query.sort) {
      const sortField = req.query.sort.startsWith('-') ? req.query.sort.substring(1) : req.query.sort;
      const sortOrder = req.query.sort.startsWith('-') ? -1 : 1;
      sortQuery = { [sortField]: sortOrder };
    }

    // ── Execute queries ──
    const [users, totalUsers] = await Promise.all([
      User.find(filterQuery)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .select('-password')               // Never expose passwords
        .lean(),

      User.countDocuments(filterQuery)
    ]);

    const totalPages = Math.ceil(totalUsers / limit);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('[ADMIN] Get all users error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching users'
    });
  }
};

/**
 * @desc    Update a user's information (admin can update any user)
 * @route   PUT /api/admin/users/:id
 * @access  Private/Admin
 * 
 * Admins can update fields that users cannot change themselves:
 * - role (promote to admin or demote)
 * - isActive (activate/deactivate account)
 * - Any standard profile fields (name, email, etc.)
 * 
 * @param {Object} req - Express request object
 * @param {string} req.params.id - User ID to update
 * @param {Object} req.body - Fields to update
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated user data
 */
const updateUser = async (req, res) => {
  try {
    // Step 1: Validate user ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }

    // Step 2: Define admin-allowed update fields
    // Admin can update more fields than regular users
    const allowedFields = ['name', 'email', 'role', 'isActive', 'bio', 'skills', 'education', 'experience', 'phone'];

    // Step 3: Build update object with only allowed fields
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields provided for update'
      });
    }

    // Step 4: Prevent admin from deactivating their own account
    if (req.params.id === req.user.id && updateData.isActive === false) {
      return res.status(400).json({
        success: false,
        error: 'You cannot deactivate your own admin account'
      });
    }

    // Step 5: Prevent admin from removing their own admin role
    if (req.params.id === req.user.id && updateData.role && updateData.role !== 'admin') {
      return res.status(400).json({
        success: false,
        error: 'You cannot remove your own admin privileges'
      });
    }

    // Step 6: Update the user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log(`[ADMIN] User ${req.params.id} updated by admin ${req.user.id}:`, Object.keys(updateData));

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('[ADMIN] Update user error:', error.message);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error while updating user'
    });
  }
};

/**
 * @desc    Delete a user from the platform
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 * 
 * Performs a "soft delete" by default (sets isActive to false),
 * preserving user data for auditing. Hard delete available via
 * query parameter ?hard=true (use with caution).
 * 
 * @param {Object} req - Express request object
 * @param {string} req.params.id - User ID to delete
 * @param {string} [req.query.hard] - If 'true', permanently delete
 * @param {Object} res - Express response object
 * @returns {Object} JSON response confirming deletion
 */
const deleteUser = async (req, res) => {
  try {
    // Step 1: Validate user ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }

    // Step 2: Prevent admin from deleting themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'You cannot delete your own admin account'
      });
    }

    // Step 3: Check if user exists
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Step 4: Soft delete (default) or hard delete
    if (req.query.hard === 'true') {
      // Hard delete - permanently remove from database
      await User.findByIdAndDelete(req.params.id);
      console.log(`[ADMIN] User ${req.params.id} (${user.email}) permanently deleted by admin ${req.user.id}`);

      res.status(200).json({
        success: true,
        message: `User "${user.name}" has been permanently deleted`
      });
    } else {
      // Soft delete - deactivate the account
      user.isActive = false;
      await user.save({ validateBeforeSave: false });

      console.log(`[ADMIN] User ${req.params.id} (${user.email}) deactivated by admin ${req.user.id}`);

      res.status(200).json({
        success: true,
        message: `User "${user.name}" has been deactivated`
      });
    }

  } catch (error) {
    console.error('[ADMIN] Delete user error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting user'
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// COURSE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Create a new course on the platform
 * @route   POST /api/admin/courses
 * @access  Private/Admin
 * 
 * Creates a new course with all metadata and optional modules.
 * The admin who creates the course is recorded as the creator.
 * 
 * @param {Object} req - Express request object
 * @param {string} req.body.title - Course title
 * @param {string} req.body.description - Course description
 * @param {string} req.body.category - Course category
 * @param {string} req.body.level - Difficulty level (beginner/intermediate/advanced)
 * @param {Array} [req.body.modules] - Course modules/lessons array
 * @param {string} [req.body.thumbnail] - Thumbnail image URL
 * @param {number} [req.body.duration] - Estimated course duration in hours
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with the created course
 */
const createCourse = async (req, res) => {
  try {
    const {
      title, description, category, level,
      modules, thumbnail, duration, tags, isPublished
    } = req.body;

    // Step 1: Validate required fields
    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        error: 'Please provide title, description, and category'
      });
    }

    // Step 2: Check for duplicate course title
    const existingCourse = await Course.findOne({ title: { $regex: `^${title}$`, $options: 'i' } });
    if (existingCourse) {
      return res.status(400).json({
        success: false,
        error: 'A course with this title already exists'
      });
    }

    // Step 3: Create the course document
    const course = await Course.create({
      title,
      description,
      category,
      level: level || 'beginner',
      modules: modules || [],
      thumbnail: thumbnail || '',
      duration: duration || 0,
      tags: tags || [],
      isPublished: isPublished !== undefined ? isPublished : true,
      createdBy: req.user.id       // Record which admin created this course
    });

    console.log(`[ADMIN] Course created: "${course.title}" by admin ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: `Course "${course.title}" created successfully`,
      data: course
    });

  } catch (error) {
    console.error('[ADMIN] Create course error:', error.message);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error while creating course'
    });
  }
};

/**
 * @desc    Update an existing course
 * @route   PUT /api/admin/courses/:id
 * @access  Private/Admin
 * 
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Course ID to update
 * @param {Object} req.body - Fields to update
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated course data
 */
const updateCourse = async (req, res) => {
  try {
    // Validate course ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }

    // Define allowed update fields
    const allowedFields = [
      'title', 'description', 'category', 'level', 'modules',
      'thumbnail', 'duration', 'tags', 'isPublished'
    ];

    // Build update object
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields provided for update'
      });
    }

    // Update the course
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    console.log(`[ADMIN] Course "${updatedCourse.title}" updated by admin ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: `Course "${updatedCourse.title}" updated successfully`,
      data: updatedCourse
    });

  } catch (error) {
    console.error('[ADMIN] Update course error:', error.message);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error while updating course'
    });
  }
};

/**
 * @desc    Delete a course from the platform
 * @route   DELETE /api/admin/courses/:id
 * @access  Private/Admin
 * 
 * Permanently removes a course. Also cleans up related data
 * (notifications referencing this course).
 * 
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Course ID to delete
 * @param {Object} res - Express response object
 * @returns {Object} JSON response confirming deletion
 */
const deleteCourse = async (req, res) => {
  try {
    // Validate course ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }

    // Find and delete the course
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Clean up related notifications
    await Notification.deleteMany({
      relatedId: req.params.id,
      relatedModel: 'Course'
    });

    console.log(`[ADMIN] Course "${course.title}" deleted by admin ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: `Course "${course.title}" has been deleted`,
      data: {
        deletedId: course._id,
        title: course.title
      }
    });

  } catch (error) {
    console.error('[ADMIN] Delete course error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting course'
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TEST MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Create a new test with questions
 * @route   POST /api/admin/tests
 * @access  Private/Admin
 * 
 * Creates a new test including all questions with options and correct answers.
 * 
 * Question format:
 * {
 *   question: "What is Node.js?",
 *   options: ["A. Runtime", "B. Language", "C. Database", "D. Framework"],
 *   correctAnswer: "A",
 *   explanation: "Node.js is a JavaScript runtime built on Chrome's V8 engine"
 * }
 * 
 * @param {Object} req - Express request object
 * @param {string} req.body.title - Test title
 * @param {string} req.body.description - Test description
 * @param {string} req.body.category - Test category
 * @param {string} req.body.type - Test type (mcq, coding, aptitude)
 * @param {string} req.body.difficulty - Difficulty level
 * @param {Array} req.body.questions - Array of question objects
 * @param {number} [req.body.duration] - Time limit in minutes
 * @param {number} [req.body.passingPercentage=40] - Passing threshold
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with the created test
 */
const createTest = async (req, res) => {
  try {
    const {
      title, description, category, type, difficulty,
      questions, duration, passingPercentage, isActive, tags
    } = req.body;

    // Step 1: Validate required fields
    if (!title || !description || !category || !questions) {
      return res.status(400).json({
        success: false,
        error: 'Please provide title, description, category, and questions'
      });
    }

    // Step 2: Validate questions array
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide at least one question'
      });
    }

    // Step 3: Validate each question has required fields
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question || !q.options || !q.correctAnswer) {
        return res.status(400).json({
          success: false,
          error: `Question ${i + 1} is missing required fields (question, options, correctAnswer)`
        });
      }
    }

    // Step 4: Create the test document
    const test = await Test.create({
      title,
      description,
      category,
      type: type || 'mcq',
      difficulty: difficulty || 'medium',
      questions,
      duration: duration || 30,                         // Default 30 minutes
      passingPercentage: passingPercentage || 40,       // Default 40% to pass
      isActive: isActive !== undefined ? isActive : true,
      tags: tags || [],
      createdBy: req.user.id
    });

    console.log(`[ADMIN] Test created: "${test.title}" (${questions.length} questions) by admin ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: `Test "${test.title}" created with ${questions.length} questions`,
      data: test
    });

  } catch (error) {
    console.error('[ADMIN] Create test error:', error.message);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error while creating test'
    });
  }
};

/**
 * @desc    Update an existing test
 * @route   PUT /api/admin/tests/:id
 * @access  Private/Admin
 * 
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Test ID to update
 * @param {Object} req.body - Fields to update
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated test data
 */
const updateTest = async (req, res) => {
  try {
    // Validate test ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid test ID format'
      });
    }

    // Allowed update fields
    const allowedFields = [
      'title', 'description', 'category', 'type', 'difficulty',
      'questions', 'duration', 'passingPercentage', 'isActive', 'tags'
    ];

    // Build update object
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields provided for update'
      });
    }

    // Validate questions if they're being updated
    if (updateData.questions) {
      if (!Array.isArray(updateData.questions) || updateData.questions.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Questions must be a non-empty array'
        });
      }
    }

    // Update the test
    const updatedTest = await Test.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTest) {
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }

    console.log(`[ADMIN] Test "${updatedTest.title}" updated by admin ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: `Test "${updatedTest.title}" updated successfully`,
      data: updatedTest
    });

  } catch (error) {
    console.error('[ADMIN] Update test error:', error.message);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error while updating test'
    });
  }
};

/**
 * @desc    Delete a test from the platform
 * @route   DELETE /api/admin/tests/:id
 * @access  Private/Admin
 * 
 * Permanently removes a test and optionally its associated results.
 * 
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Test ID to delete
 * @param {Object} res - Express response object
 * @returns {Object} JSON response confirming deletion
 */
const deleteTest = async (req, res) => {
  try {
    // Validate test ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid test ID format'
      });
    }

    // Find and delete the test
    const test = await Test.findByIdAndDelete(req.params.id);

    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }

    // Clean up related data
    await Promise.all([
      // Delete all results associated with this test
      Result.deleteMany({ test: req.params.id }),
      // Delete related notifications
      Notification.deleteMany({ relatedId: req.params.id, relatedModel: 'Test' })
    ]);

    console.log(`[ADMIN] Test "${test.title}" deleted by admin ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: `Test "${test.title}" and its associated results have been deleted`,
      data: {
        deletedId: test._id,
        title: test.title
      }
    });

  } catch (error) {
    console.error('[ADMIN] Delete test error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting test'
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PLATFORM ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Get platform-wide analytics and statistics
 * @route   GET /api/admin/analytics
 * @access  Private/Admin
 * 
 * Provides deep analytics across the entire platform:
 * - User growth trend (registrations over time)
 * - Course popularity (by enrollment count)
 * - Test performance distribution
 * - Category-wise analysis
 * - Time-based activity patterns
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with platform-wide analytics
 */
const getPlatformAnalytics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // ── Run all analytics queries in parallel ──
    const [
      userGrowth,
      popularCourses,
      testPerformanceDist,
      categoryAnalysis,
      dailyActivity
    ] = await Promise.all([

      // User registration trend (last 30 days, grouped by day)
      User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Most popular courses (by enrollment count)
      Course.aggregate([
        {
          $project: {
            title: 1,
            category: 1,
            enrollmentCount: {
              $cond: {
                if: { $isArray: '$enrolledStudents' },
                then: { $size: '$enrolledStudents' },
                else: 0
              }
            }
          }
        },
        { $sort: { enrollmentCount: -1 } },
        { $limit: 10 }
      ]),

      // Test score distribution (percentage ranges)
      Result.aggregate([
        {
          $bucket: {
            groupBy: '$percentage',
            boundaries: [0, 20, 40, 60, 80, 101],          // Score ranges
            default: 'Other',
            output: {
              count: { $sum: 1 },
              avgScore: { $avg: '$percentage' }
            }
          }
        }
      ]),

      // Category-wise test analysis
      Result.aggregate([
        {
          $group: {
            _id: '$category',
            totalAttempts: { $sum: 1 },
            avgScore: { $avg: '$percentage' },
            passRate: {
              $avg: { $cond: ['$passed', 1, 0] }
            }
          }
        },
        { $sort: { totalAttempts: -1 } }
      ]),

      // Daily test activity (last 30 days)
      Result.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            testsCount: { $sum: 1 },
            avgScore: { $avg: '$percentage' }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Format score distribution for readability
    const scoreDistribution = testPerformanceDist.map(bucket => {
      const labels = {
        0: '0-19%', 20: '20-39%', 40: '40-59%', 60: '60-79%', 80: '80-100%'
      };
      return {
        range: labels[bucket._id] || 'Other',
        count: bucket.count,
        avgScore: Math.round(bucket.avgScore * 10) / 10
      };
    });

    // Format category analysis
    const formattedCategories = categoryAnalysis.map(cat => ({
      category: cat._id || 'Uncategorized',
      totalAttempts: cat.totalAttempts,
      avgScore: Math.round(cat.avgScore * 10) / 10,
      passRate: Math.round(cat.passRate * 100)
    }));

    res.status(200).json({
      success: true,
      data: {
        userGrowth,
        popularCourses,
        scoreDistribution,
        categoryAnalysis: formattedCategories,
        dailyActivity,
        period: {
          from: thirtyDaysAgo.toISOString().split('T')[0],
          to: new Date().toISOString().split('T')[0]
        }
      }
    });

  } catch (error) {
    console.error('[ADMIN] Platform analytics error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching platform analytics'
    });
  }
};

/**
 * @desc    Get paginated activity logs for the platform
 * @route   GET /api/admin/activity-logs
 * @access  Private/Admin
 * 
 * Returns a chronological log of significant platform activities:
 * - User registrations
 * - Test submissions with scores
 * - Course enrollments
 * - Admin actions
 * 
 * Since we don't have a dedicated ActivityLog model yet, this
 * aggregates activity from multiple collections and sorts by date.
 * 
 * @param {Object} req - Express request object
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=20] - Logs per page
 * @param {string} [req.query.type] - Filter by activity type
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with paginated activity logs
 */
const getActivityLogs = async (req, res) => {
  try {
    // ── Parse pagination ──
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    // ── Date range filter ──
    const filterDate = {};
    if (req.query.from) {
      filterDate.$gte = new Date(req.query.from);
    }
    if (req.query.to) {
      filterDate.$lte = new Date(req.query.to);
    }

    // ── Build activity logs from multiple sources ──
    // We aggregate recent activities from different collections

    const dateFilter = Object.keys(filterDate).length > 0 ? { createdAt: filterDate } : {};

    // Get recent activities based on type filter
    let activities = [];

    if (!req.query.type || req.query.type === 'registration') {
      // Recent user registrations
      const recentUsers = await User.find(dateFilter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('name email role createdAt')
        .lean();

      activities = activities.concat(
        recentUsers.map(user => ({
          type: 'registration',
          message: `New user registered: ${user.name} (${user.email})`,
          user: { name: user.name, email: user.email },
          role: user.role,
          timestamp: user.createdAt
        }))
      );
    }

    if (!req.query.type || req.query.type === 'test_submission') {
      // Recent test submissions
      const recentResults = await Result.find(dateFilter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('user', 'name email')
        .populate('test', 'title')
        .select('percentage passed createdAt')
        .lean();

      activities = activities.concat(
        recentResults.map(result => ({
          type: 'test_submission',
          message: `${result.user?.name || 'Unknown'} scored ${result.percentage}% on "${result.test?.title || 'Unknown Test'}"`,
          user: result.user ? { name: result.user.name, email: result.user.email } : null,
          score: result.percentage,
          passed: result.passed,
          timestamp: result.createdAt
        }))
      );
    }

    // Sort all activities by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply pagination to combined results
    const totalActivities = activities.length;
    const paginatedActivities = activities.slice(skip, skip + limit);
    const totalPages = Math.ceil(totalActivities / limit);

    res.status(200).json({
      success: true,
      data: {
        activities: paginatedActivities,
        pagination: {
          currentPage: page,
          totalPages,
          totalActivities,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('[ADMIN] Activity logs error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching activity logs'
    });
  }
};

// ─── Export All Controller Functions ────────────────────────────────────────────
module.exports = {
  // Dashboard
  getDashboardStats,
  // User Management
  getAllUsers,
  updateUser,
  deleteUser,
  // Course Management
  createCourse,
  updateCourse,
  deleteCourse,
  // Test Management
  createTest,
  updateTest,
  deleteTest,
  // Platform Analytics
  getPlatformAnalytics,
  getActivityLogs
};
