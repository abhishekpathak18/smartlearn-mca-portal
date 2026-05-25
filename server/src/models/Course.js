/**
 * ============================================================================
 * Course Model - Smart Learning & Placement Preparation Portal
 * ============================================================================
 *
 * This model represents courses available on the learning portal.
 * Features include:
 *   - Structured modules with video content and resources
 *   - Student enrollment tracking via ObjectId references
 *   - Rating system for course quality feedback
 *   - Category and level-based classification
 *   - Tag-based searchability
 *
 * @module models/Course
 * @requires mongoose
 */

const mongoose = require('mongoose');

/**
 * Sub-schema for individual resources within a module.
 * Each resource has a name and a URL (e.g., PDF link, GitHub repo).
 *
 * @typedef {Object} ResourceSchema
 * @property {String} name - Display name of the resource
 * @property {String} url - URL or path to the resource file
 */
const resourceSchema = new mongoose.Schema(
  {
    /** Display name for the resource (e.g., "Lecture Notes PDF") */
    name: {
      type: String,
      required: [true, 'Resource name is required'],
      trim: true,
    },

    /** URL pointing to the resource (e.g., Google Drive link, S3 URL) */
    url: {
      type: String,
      required: [true, 'Resource URL is required'],
    },
  },
  {
    _id: false, // Don't create a separate _id for each resource sub-document
  }
);

/**
 * Sub-schema for course modules (chapters/sections).
 * Each module represents a lesson or topic within the course.
 *
 * @typedef {Object} ModuleSchema
 * @property {String} title - Module/lesson title
 * @property {String} description - Brief description of the module content
 * @property {String} videoUrl - URL to the video lecture
 * @property {Number} duration - Duration of the module in minutes
 * @property {Array<ResourceSchema>} resources - Supplementary materials
 * @property {Number} order - Sort order of the module within the course
 */
const moduleSchema = new mongoose.Schema(
  {
    /** Title of the module/lesson (e.g., "Introduction to Arrays") */
    title: {
      type: String,
      required: [true, 'Module title is required'],
      trim: true,
    },

    /** Brief summary of what the module covers */
    description: {
      type: String,
      trim: true,
    },

    /** URL to the video lecture (YouTube, Vimeo, self-hosted, etc.) */
    videoUrl: {
      type: String,
    },

    /** Duration of the module content in minutes */
    duration: {
      type: Number,
      min: [0, 'Duration cannot be negative'],
    },

    /**
     * Array of supplementary resources for this module.
     * Each resource contains a name and a download/access URL.
     */
    resources: [resourceSchema],

    /**
     * Numeric order for sorting modules within the course.
     * Lower numbers appear first (e.g., 1, 2, 3...).
     */
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: true, // Each module gets its own _id for individual access
  }
);

/**
 * Main Course Schema.
 *
 * @typedef {Object} CourseSchema
 * @property {String} title - Course title (required)
 * @property {String} description - Detailed course description (required)
 * @property {String} category - Subject category from predefined enum
 * @property {String} thumbnail - URL to course thumbnail image
 * @property {String} instructor - Name of the course instructor (required)
 * @property {String} duration - Total estimated duration (e.g., "10 hours")
 * @property {String} level - Difficulty level of the course
 * @property {Array<ModuleSchema>} modules - Ordered list of course modules
 * @property {Array<ObjectId>} enrolledStudents - Students enrolled in the course
 * @property {Number} rating - Average rating (0-5 scale)
 * @property {Number} totalRatings - Total number of ratings received
 * @property {Array<String>} tags - Searchable tags for the course
 * @property {Boolean} isPublished - Whether the course is visible to students
 * @property {ObjectId} createdBy - Reference to the admin who created the course
 */
const courseSchema = new mongoose.Schema(
  {
    // ── Basic Course Information ─────────────────────────────────────

    /**
     * Title of the course — displayed on the course card and detail page.
     * Must be unique enough to distinguish from other courses.
     */
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    /**
     * Detailed description explaining what the course covers,
     * prerequisites, and learning outcomes.
     */
    description: {
      type: String,
      required: [true, 'Course description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    /**
     * Category classifies the course into a subject area.
     * Used for filtering and organizing courses on the dashboard.
     * Enum values cover the major areas relevant to MCA placement prep.
     */
    category: {
      type: String,
      enum: {
        values: [
          'programming',    // C, C++, Java, Python fundamentals
          'dsa',            // Data Structures & Algorithms
          'web-dev',        // Web Development (HTML/CSS/JS/React/Node)
          'database',       // SQL, NoSQL, database design
          'ai-ml',          // Artificial Intelligence & Machine Learning
          'aptitude',       // Quantitative, Logical, Verbal aptitude
          'soft-skills',    // Communication, teamwork, leadership
        ],
        message: 'Invalid category. Must be one of: programming, dsa, web-dev, database, ai-ml, aptitude, soft-skills',
      },
    },

    /**
     * URL or path to the course thumbnail image.
     * Displayed on course listing cards for visual appeal.
     */
    thumbnail: {
      type: String,
    },

    /**
     * Name of the primary instructor or content creator.
     * Displayed on the course page for attribution.
     */
    instructor: {
      type: String,
      required: [true, 'Instructor name is required'],
      trim: true,
    },

    /**
     * Total estimated duration of the course (free-form string).
     * Example: "10 hours", "6 weeks", "30 minutes per day for 15 days"
     */
    duration: {
      type: String,
      trim: true,
    },

    // ── Course Classification ───────────────────────────────────────

    /**
     * Difficulty level of the course.
     * Helps students pick courses matching their current skill level.
     */
    level: {
      type: String,
      enum: {
        values: ['beginner', 'intermediate', 'advanced'],
        message: 'Level must be beginner, intermediate, or advanced',
      },
      default: 'beginner',
    },

    // ── Course Content ──────────────────────────────────────────────

    /**
     * Array of module sub-documents representing the course curriculum.
     * Each module is a chapter/lesson with video, description, and resources.
     * Modules should be ordered using the `order` field.
     */
    modules: [moduleSchema],

    // ── Enrollment & Ratings ────────────────────────────────────────

    /**
     * Array of User ObjectIds who have enrolled in this course.
     * Used to:
     *   - Track enrollment count
     *   - Check if a specific user is enrolled
     *   - Send notifications to enrolled students
     */
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
      },
    ],

    /**
     * Average rating of the course on a 0-5 scale.
     * Computed and updated whenever a new rating is submitted.
     */
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
    },

    /**
     * Total number of ratings the course has received.
     * Used together with `rating` to compute the weighted average
     * when a new rating is added:
     *   newAvg = ((rating * totalRatings) + newRating) / (totalRatings + 1)
     */
    totalRatings: {
      type: Number,
      default: 0,
    },

    // ── Metadata & Discoverability ──────────────────────────────────

    /**
     * Tags for search and filtering purposes.
     * Example: ['javascript', 'react', 'frontend', 'hooks']
     */
    tags: {
      type: [String],
      default: [],
    },

    /**
     * Publication status of the course.
     * Only published courses (isPublished: true) are visible to students.
     * Admins can create draft courses and publish them later.
     */
    isPublished: {
      type: Boolean,
      default: true,
    },

    /**
     * Reference to the admin/user who created this course.
     * Used for ownership verification and admin dashboards.
     */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
    },
  },
  {
    /**
     * Automatically adds createdAt and updatedAt timestamps.
     * createdAt: When the course was first created
     * updatedAt: When the course was last modified
     */
    timestamps: true,
  }
);

// ── Create and Export the Model ─────────────────────────────────────────
/**
 * Create the Course model from the schema.
 * MongoDB will create a 'courses' collection (lowercase, pluralized).
 */
const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
