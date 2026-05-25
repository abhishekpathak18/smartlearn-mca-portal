/**
 * ============================================================================
 * Result Model - Smart Learning & Placement Preparation Portal
 * ============================================================================
 *
 * This model stores the outcome of each test attempt by a student.
 * It captures:
 *   - The student's answers for each question
 *   - Score, total marks, and percentage
 *   - Time taken to complete the test
 *   - Submission timestamp
 *
 * A compound index on {user, test} enables efficient queries like:
 *   - "Get all results for a specific user"
 *   - "Get all results for a specific test"
 *   - "Check if a user has already attempted a test"
 *
 * @module models/Result
 * @requires mongoose
 */

const mongoose = require('mongoose');

/**
 * Sub-schema for individual answer entries.
 * Each entry corresponds to one question in the test and records
 * the student's selected answer and whether it was correct.
 *
 * @typedef {Object} AnswerSchema
 * @property {Number} questionIndex - Index of the question in the test's questions array
 * @property {Number} selectedAnswer - Index of the option the student selected
 * @property {Boolean} isCorrect - Whether the selected answer was correct
 */
const answerSchema = new mongoose.Schema(
  {
    /**
     * Zero-based index referring to the question's position in
     * the test's `questions` array. This links the answer back
     * to the specific question without needing a separate reference.
     */
    questionIndex: {
      type: Number,
      required: [true, 'Question index is required'],
    },

    /**
     * Zero-based index of the option the student selected.
     * -1 or null can indicate the question was skipped/unanswered.
     */
    selectedAnswer: {
      type: Number,
    },

    /**
     * Boolean flag indicating whether the student's answer was correct.
     * Pre-computed at submission time by comparing selectedAnswer
     * with the question's correctAnswer field.
     */
    isCorrect: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false, // No separate _id needed for answer sub-documents
  }
);

/**
 * Main Result Schema.
 *
 * @typedef {Object} ResultSchema
 * @property {ObjectId} user - Reference to the student who took the test (required)
 * @property {ObjectId} test - Reference to the test that was attempted (required)
 * @property {Array<AnswerSchema>} answers - Student's answers for each question
 * @property {Number} score - Marks obtained by the student (required)
 * @property {Number} totalMarks - Maximum marks possible (required)
 * @property {Number} percentage - Score as a percentage (required)
 * @property {Number} timeTaken - Time taken to complete in seconds
 * @property {Date} submittedAt - When the test was submitted
 */
const resultSchema = new mongoose.Schema(
  {
    // ── References ──────────────────────────────────────────────────

    /**
     * Reference to the User who attempted the test.
     * Required for tracking individual student performance.
     * Populated when fetching results to display student details.
     */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',       // Reference to the User model
      required: [true, 'User reference is required'],
    },

    /**
     * Reference to the Test that was attempted.
     * Required for linking results back to the test content.
     * Populated when fetching results to display test details.
     */
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',        // Reference to the Test model
      required: [true, 'Test reference is required'],
    },

    // ── Answer Data ─────────────────────────────────────────────────

    /**
     * Array of answer sub-documents, one per question.
     * Contains the student's response and correctness for each question.
     * Used to generate detailed result breakdowns and analytics.
     */
    answers: [answerSchema],

    // ── Scoring ─────────────────────────────────────────────────────

    /**
     * Total marks/score obtained by the student.
     * Calculated server-side by summing marks for correct answers.
     * Never trust client-side scoring — always compute on the backend.
     */
    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: [0, 'Score cannot be negative'],
    },

    /**
     * Maximum marks possible for this test attempt.
     * Stored here (in addition to Test model) to preserve the value
     * even if the test's totalMarks is later modified.
     */
    totalMarks: {
      type: Number,
      required: [true, 'Total marks is required'],
      min: [0, 'Total marks cannot be negative'],
    },

    /**
     * Percentage score: (score / totalMarks) * 100.
     * Pre-computed and stored for efficient sorting, filtering,
     * and display without recalculation.
     */
    percentage: {
      type: Number,
      required: [true, 'Percentage is required'],
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100'],
    },

    // ── Timing ──────────────────────────────────────────────────────

    /**
     * Time taken by the student to complete the test, in seconds.
     * Tracked by the frontend timer and submitted with the answers.
     * Used in analytics to assess time management skills.
     */
    timeTaken: {
      type: Number,
      min: [0, 'Time taken cannot be negative'],
    },

    /**
     * Timestamp when the test was submitted.
     * Defaults to the current time at the moment of document creation.
     */
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    /**
     * Note: We do NOT use timestamps: true here because we have
     * our own `submittedAt` field. However, you could add it
     * if you also want createdAt/updatedAt tracking.
     */
  }
);

// ── Compound Index ──────────────────────────────────────────────────────
/**
 * Compound index on {user, test} for efficient queries:
 *   1. Find all results for a specific user (user: userId)
 *   2. Find all results for a specific test (test: testId)
 *   3. Find a specific user's result for a specific test (user + test)
 *
 * This index significantly improves query performance for the most
 * common result lookup patterns in the application.
 */
resultSchema.index({ user: 1, test: 1 });

// ── Create and Export the Model ─────────────────────────────────────────
/**
 * Create the Result model from the schema.
 * MongoDB will create a 'results' collection (lowercase, pluralized).
 */
const Result = mongoose.model('Result', resultSchema);

module.exports = Result;
