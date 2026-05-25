/**
 * ============================================================================
 * Test Model - Smart Learning & Placement Preparation Portal
 * ============================================================================
 *
 * This model represents assessments (quizzes, mock tests, practice sets)
 * that students can attempt on the portal. Features include:
 *   - Multiple question types with difficulty levels
 *   - Configurable time limits and passing criteria
 *   - Explanation for each answer (AI-friendly for review)
 *   - Attempt tracking for analytics
 *   - Category-based organization
 *
 * @module models/Test
 * @requires mongoose
 */

const mongoose = require('mongoose');

/**
 * Sub-schema for individual questions within a test.
 * Each question is a multiple-choice question (MCQ) with:
 *   - The question text
 *   - An array of answer options
 *   - The index of the correct answer
 *   - An optional explanation for the correct answer
 *   - A difficulty level and marks allocation
 *
 * @typedef {Object} QuestionSchema
 * @property {String} question - The question text
 * @property {Array<String>} options - Array of answer choices
 * @property {Number} correctAnswer - Index (0-based) of the correct option
 * @property {String} explanation - Explanation of why the answer is correct
 * @property {String} difficulty - Difficulty level: easy, medium, or hard
 * @property {Number} marks - Points awarded for a correct answer
 */
const questionSchema = new mongoose.Schema(
  {
    /**
     * The question text displayed to the student.
     * Should be clear and unambiguous.
     * Example: "What is the time complexity of binary search?"
     */
    question: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },

    /**
     * Array of possible answer options.
     * Typically 4 options for MCQ format.
     * Example: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)']
     */
    options: {
      type: [String],
      default: [],
    },

    /**
     * Zero-based index of the correct answer in the options array.
     * Example: If correctAnswer = 2, then options[2] is the right answer.
     * This approach avoids storing the answer text and prevents mismatches.
     */
    correctAnswer: {
      type: Number,
      required: [true, 'Correct answer index is required'],
    },

    /**
     * Detailed explanation of why the correct answer is right.
     * Shown to the student after test submission for learning purposes.
     * Can also be used by the AI for generating study recommendations.
     */
    explanation: {
      type: String,
      trim: true,
    },

    /**
     * Difficulty level of the question.
     * Used for:
     *   - Adaptive question selection
     *   - Analytics on student performance by difficulty
     *   - Balanced test generation
     */
    difficulty: {
      type: String,
      enum: {
        values: ['easy', 'medium', 'hard'],
        message: 'Difficulty must be easy, medium, or hard',
      },
      default: 'medium',
    },

    /**
     * Marks/points awarded for correctly answering this question.
     * Default is 1 mark per question. Can be adjusted for
     * weighted scoring (e.g., hard questions worth more marks).
     */
    marks: {
      type: Number,
      default: 1,
      min: [0, 'Marks cannot be negative'],
    },
  },
  {
    _id: true, // Each question gets its own _id for individual reference
  }
);

/**
 * Main Test Schema.
 *
 * @typedef {Object} TestSchema
 * @property {String} title - Test title (required)
 * @property {String} description - Brief description of the test
 * @property {String} category - Subject/topic category (required)
 * @property {String} type - Type of test: quiz, mock-test, or practice
 * @property {Number} duration - Time limit in minutes
 * @property {Number} totalMarks - Maximum marks achievable
 * @property {Number} passingMarks - Minimum marks required to pass
 * @property {Array<QuestionSchema>} questions - Array of question sub-documents
 * @property {Number} attempts - Total number of times this test has been attempted
 * @property {Boolean} isPublished - Whether the test is visible to students
 * @property {ObjectId} createdBy - Reference to the admin who created the test
 */
const testSchema = new mongoose.Schema(
  {
    // ── Test Information ────────────────────────────────────────────

    /**
     * Title of the test — displayed on the test listing and detail pages.
     * Should clearly describe the test content.
     * Example: "DSA Mock Test - Arrays & Strings"
     */
    title: {
      type: String,
      required: [true, 'Test title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    /**
     * Brief description explaining what the test covers,
     * the topics included, and any special instructions.
     */
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },

    /**
     * Subject/topic category for the test.
     * Used for filtering and organizing tests on the dashboard.
     * Example: "Data Structures", "JavaScript", "Aptitude"
     */
    category: {
      type: String,
      required: [true, 'Test category is required'],
      trim: true,
    },

    // ── Test Configuration ──────────────────────────────────────────

    /**
     * Type of test determines the testing experience:
     *   - 'quiz': Quick assessment, usually shorter
     *   - 'mock-test': Full-length simulated placement test
     *   - 'practice': No time pressure, focus on learning
     */
    type: {
      type: String,
      enum: {
        values: ['quiz', 'mock-test', 'practice'],
        message: 'Test type must be quiz, mock-test, or practice',
      },
      default: 'quiz',
    },

    /**
     * Time limit for the test in minutes.
     * If null/undefined, the test has no time limit (useful for practice mode).
     * The frontend timer counts down from this value.
     */
    duration: {
      type: Number,
      min: [1, 'Duration must be at least 1 minute'],
    },

    /**
     * Maximum marks achievable on this test.
     * Typically the sum of all question marks, but can be set independently.
     */
    totalMarks: {
      type: Number,
      min: [0, 'Total marks cannot be negative'],
    },

    /**
     * Minimum marks required to pass the test.
     * Used to display pass/fail status on the result page.
     */
    passingMarks: {
      type: Number,
      min: [0, 'Passing marks cannot be negative'],
    },

    // ── Questions ───────────────────────────────────────────────────

    /**
     * Array of question sub-documents embedded within the test.
     * Embedding (instead of referencing) is chosen because:
     *   1. Questions always belong to a specific test
     *   2. We need to fetch all questions with the test in a single query
     *   3. Questions are not shared across tests
     */
    questions: [questionSchema],

    // ── Analytics & Status ──────────────────────────────────────────

    /**
     * Counter tracking how many times this test has been attempted.
     * Incremented each time a student submits the test.
     * Useful for popularity ranking and analytics.
     */
    attempts: {
      type: Number,
      default: 0,
    },

    /**
     * Publication status of the test.
     * Only published tests (isPublished: true) are visible to students.
     * Admins can create draft tests and publish them when ready.
     */
    isPublished: {
      type: Boolean,
      default: true,
    },

    /**
     * Reference to the admin/user who created this test.
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
     */
    timestamps: true,
  }
);

// ── Create and Export the Model ─────────────────────────────────────────
/**
 * Create the Test model from the schema.
 * MongoDB will create a 'tests' collection (lowercase, pluralized).
 */
const Test = mongoose.model('Test', testSchema);

module.exports = Test;
