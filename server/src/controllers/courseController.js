/**
 * ============================================================================
 * COURSE CONTROLLER - Smart Learning & Placement Preparation Portal
 * ============================================================================
 * 
 * This controller handles all course-related operations:
 * - Browse courses with search, filter, pagination, and sorting
 * - View individual course details with populated modules
 * - Enroll in a course (add user to enrolledStudents array)
 * - View enrolled courses for the logged-in user
 * - Rate a course (add/update rating)
 * 
 * Courses are the core learning content of the platform. Each course
 * contains modules/lessons and can be enrolled in by students.
 * 
 * Pagination format follows standard API conventions:
 * - page (default: 1) - Which page of results to return
 * - limit (default: 10) - How many results per page
 * - Response includes totalPages, currentPage, totalCourses
 * 
 * @module controllers/courseController
 * @requires mongoose models: Course, Notification
 * ============================================================================
 */

// ─── Module Imports ─────────────────────────────────────────────────────────────
const Course = require('../models/Course');               // Course Mongoose model
const Notification = require('../models/Notification');   // Notification model for enrollment alerts

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Get all courses with pagination, search, filtering, and sorting
 * @route   GET /api/courses
 * @access  Public (anyone can browse courses)
 * 
 * Supports the following query parameters:
 * - page: Page number for pagination (default: 1)
 * - limit: Number of courses per page (default: 10, max: 50)
 * - search: Search string to match against course title (case-insensitive regex)
 * - category: Filter by course category (exact match)
 * - level: Filter by difficulty level (beginner, intermediate, advanced)
 * - sort: Sort field (e.g., 'createdAt', '-createdAt', 'title', '-rating')
 *         Prefix with '-' for descending order
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters for filtering/pagination
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with paginated courses array and metadata
 * 
 * @example
 * GET /api/courses?page=1&limit=10&search=javascript&category=programming&level=beginner&sort=-createdAt
 */
const getCourses = async (req, res) => {
  try {
    // ── Step 1: Extract and parse query parameters ──
    const page = parseInt(req.query.page, 10) || 1;               // Default page 1
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50); // Default 10, max 50
    const skip = (page - 1) * limit;                                 // Calculate documents to skip

    const { search, category, level, sort } = req.query;

    // ── Step 2: Build the filter query object ──
    // We start with an empty object and add conditions based on query params
    const filterQuery = {};

    // Search: Use MongoDB regex for case-insensitive title matching
    // $regex creates a pattern match, 'i' flag makes it case-insensitive
    if (search) {
      filterQuery.title = {
        $regex: search,           // Match the search string anywhere in the title
        $options: 'i'             // Case-insensitive flag
      };
    }

    // Category filter: Exact match on category field
    if (category) {
      filterQuery.category = category;
    }

    // Level filter: Exact match on difficulty level
    if (level) {
      filterQuery.level = level;
    }

    // Only show published/active courses to non-admin users
    filterQuery.isPublished = true;

    // ── Step 3: Build the sort object ──
    // Default sort: newest courses first (-createdAt)
    let sortQuery = { createdAt: -1 };

    if (sort) {
      // Parse the sort parameter
      // If it starts with '-', sort descending; otherwise ascending
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
      const sortOrder = sort.startsWith('-') ? -1 : 1;
      sortQuery = { [sortField]: sortOrder };
    }

    // ── Step 4: Execute the query with pagination ──
    // We run count and find in parallel for efficiency
    const [courses, totalCourses] = await Promise.all([
      // Find courses matching filter, apply sort, skip, and limit
      Course.find(filterQuery)
        .sort(sortQuery)
        .skip(skip)                          // Skip documents for pagination
        .limit(limit)                        // Limit results per page
        .select('-modules')                  // Exclude modules array (can be large) in list view
        .lean(),                             // Return plain JS objects (faster, less memory)

      // Count total matching documents for pagination metadata
      Course.countDocuments(filterQuery)
    ]);

    // ── Step 5: Calculate pagination metadata ──
    const totalPages = Math.ceil(totalCourses / limit);

    res.status(200).json({
      success: true,
      data: {
        courses,
        pagination: {
          currentPage: page,
          totalPages,
          totalCourses,
          limit,
          hasNextPage: page < totalPages,        // Useful for "Load More" buttons
          hasPrevPage: page > 1                  // Useful for navigation
        }
      }
    });

  } catch (error) {
    console.error('[COURSE] Get courses error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching courses'
    });
  }
};

/**
 * @desc    Get a single course by ID with full details
 * @route   GET /api/courses/:id
 * @access  Public
 * 
 * Returns the complete course document including:
 * - All course metadata (title, description, category, etc.)
 * - Modules/lessons array (the actual learning content)
 * - Count of enrolled students
 * - Average rating
 * 
 * Uses Mongoose virtual populate if configured, or manual count query.
 * 
 * @param {Object} req - Express request object
 * @param {string} req.params.id - The MongoDB ObjectId of the course
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with the complete course data
 */
const getCourse = async (req, res) => {
  try {
    // Step 1: Find the course by its ID
    const course = await Course.findById(req.params.id)
      .populate('createdBy', 'name email');    // Populate the creator's name and email

    // Step 2: Check if course exists
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Step 3: Get the count of enrolled students
    // We count the enrolledStudents array length, or use a separate query
    const enrolledCount = course.enrolledStudents ? course.enrolledStudents.length : 0;

    res.status(200).json({
      success: true,
      data: {
        course,
        enrolledStudentsCount: enrolledCount
      }
    });

  } catch (error) {
    console.error('[COURSE] Get course error:', error.message);

    // Handle invalid MongoDB ObjectId format
    // This happens when the :id parameter isn't a valid 24-char hex string
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error while fetching course'
    });
  }
};

/**
 * @desc    Enroll the logged-in user in a course
 * @route   POST /api/courses/:id/enroll
 * @access  Private (requires authentication)
 * 
 * Flow:
 * 1. Find the course by ID
 * 2. Check if user is already enrolled (prevent duplicate enrollment)
 * 3. Add user's ID to the course's enrolledStudents array
 * 4. Create a notification for the user confirming enrollment
 * 5. Respond with success
 * 
 * Uses MongoDB's $addToSet operator which only adds if not already present,
 * providing an atomic operation for enrollment.
 * 
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Course ID to enroll in
 * @param {Object} res - Express response object
 * @returns {Object} JSON response confirming enrollment
 */
const enrollCourse = async (req, res) => {
  try {
    // Step 1: Find the course
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Step 2: Check if user is already enrolled
    // We convert ObjectIds to strings for comparison
    const isAlreadyEnrolled = course.enrolledStudents &&
      course.enrolledStudents.some(
        studentId => studentId.toString() === req.user.id.toString()
      );

    if (isAlreadyEnrolled) {
      return res.status(400).json({
        success: false,
        error: 'You are already enrolled in this course'
      });
    }

    // Step 3: Add user to enrolledStudents array using $addToSet
    // $addToSet is an atomic operator that only adds if not already present
    // This provides a race-condition-safe enrollment
    await Course.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { enrolledStudents: req.user.id } },
      { new: true }
    );

    // Step 4: Create a notification for the user
    // This will appear in their notifications panel
    await Notification.create({
      user: req.user.id,
      title: 'Course Enrollment',
      message: `You have successfully enrolled in "${course.title}"`,
      type: 'enrollment',
      relatedId: course._id,
      relatedModel: 'Course'
    });

    // Step 5: Log the enrollment
    console.log(`[COURSE] User ${req.user.id} enrolled in course: ${course.title}`);

    res.status(200).json({
      success: true,
      message: `Successfully enrolled in "${course.title}"`,
      data: {
        courseId: course._id,
        courseTitle: course.title
      }
    });

  } catch (error) {
    console.error('[COURSE] Enroll course error:', error.message);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error during enrollment'
    });
  }
};

/**
 * @desc    Get all courses the logged-in user is enrolled in
 * @route   GET /api/courses/enrolled
 * @access  Private (requires authentication)
 * 
 * Finds all courses where the user's ID is in the enrolledStudents array.
 * Supports pagination for users enrolled in many courses.
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.query.page - Page number (default: 1)
 * @param {Object} req.query.limit - Results per page (default: 10)
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with array of enrolled courses
 */
const getEnrolledCourses = async (req, res) => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;

    // Find courses where the logged-in user's ID is in the enrolledStudents array
    // The $in operator checks if a value exists within an array field
    const [courses, totalCourses] = await Promise.all([
      Course.find({ enrolledStudents: req.user.id })
        .sort({ createdAt: -1 })       // Most recently enrolled first
        .skip(skip)
        .limit(limit)
        .select('title description category level thumbnail createdAt')
        .lean(),

      Course.countDocuments({ enrolledStudents: req.user.id })
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCourses / limit);

    res.status(200).json({
      success: true,
      data: {
        courses,
        pagination: {
          currentPage: page,
          totalPages,
          totalCourses,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('[COURSE] Get enrolled courses error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching enrolled courses'
    });
  }
};

/**
 * @desc    Add or update a rating for a course
 * @route   POST /api/courses/:id/rate
 * @access  Private (requires authentication)
 * 
 * Allows enrolled students to rate a course from 1 to 5.
 * If the user has already rated the course, their rating is updated.
 * The course's average rating is recalculated after each new rating.
 * 
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Course ID to rate
 * @param {number} req.body.rating - Rating value (1-5)
 * @param {string} [req.body.review] - Optional text review
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated course rating
 */
const rateCourse = async (req, res) => {
  try {
    const { rating, review } = req.body;

    // Step 1: Validate rating value
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be a number between 1 and 5'
      });
    }

    // Step 2: Find the course
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Step 3: Check if the user is enrolled in the course
    // Only enrolled students should be able to rate
    const isEnrolled = course.enrolledStudents &&
      course.enrolledStudents.some(
        studentId => studentId.toString() === req.user.id.toString()
      );

    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        error: 'You must be enrolled in the course to rate it'
      });
    }

    // Step 4: Initialize ratings array if it doesn't exist
    if (!course.ratings) {
      course.ratings = [];
    }

    // Step 5: Check if user has already rated this course
    const existingRatingIndex = course.ratings.findIndex(
      r => r.user && r.user.toString() === req.user.id.toString()
    );

    if (existingRatingIndex !== -1) {
      // Update existing rating
      course.ratings[existingRatingIndex].rating = rating;
      course.ratings[existingRatingIndex].review = review || '';
    } else {
      // Add new rating
      course.ratings.push({
        user: req.user.id,
        rating,
        review: review || ''
      });
    }

    // Step 6: Recalculate the average rating
    // Sum all ratings and divide by count
    const totalRatings = course.ratings.length;
    const sumRatings = course.ratings.reduce((sum, r) => sum + r.rating, 0);
    course.averageRating = Math.round((sumRatings / totalRatings) * 10) / 10; // Round to 1 decimal

    // Step 7: Save the updated course
    await course.save();

    console.log(`[COURSE] User ${req.user.id} rated course ${course.title}: ${rating}/5`);

    res.status(200).json({
      success: true,
      message: 'Rating submitted successfully',
      data: {
        averageRating: course.averageRating,
        totalRatings
      }
    });

  } catch (error) {
    console.error('[COURSE] Rate course error:', error.message);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error while submitting rating'
    });
  }
};

// ─── Export All Controller Functions ────────────────────────────────────────────
module.exports = {
  getCourses,
  getCourse,
  enrollCourse,
  getEnrolledCourses,
  rateCourse
};
