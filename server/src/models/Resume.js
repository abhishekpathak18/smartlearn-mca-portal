/**
 * ============================================================================
 * Resume Model - Smart Learning & Placement Preparation Portal
 * ============================================================================
 *
 * This model stores uploaded resumes and their AI-powered analysis results.
 * The workflow is:
 *   1. Student uploads a resume (PDF/DOCX)
 *   2. Text is extracted from the file and stored as `originalText`
 *   3. Gemini AI analyzes the resume content
 *   4. Analysis results (scores, strengths, suggestions) are stored
 *
 * The analysis provides actionable feedback to help students improve
 * their resumes before placement season.
 *
 * @module models/Resume
 * @requires mongoose
 */

const mongoose = require('mongoose');

/**
 * Sub-schema for the AI-generated resume analysis.
 * Contains multiple scoring dimensions and textual feedback.
 *
 * @typedef {Object} AnalysisSchema
 * @property {Number} overallScore - Overall resume quality score (0-100)
 * @property {Array<String>} strengths - Things the resume does well
 * @property {Array<String>} improvements - Areas that need improvement
 * @property {Array<String>} suggestions - Specific actionable suggestions
 * @property {Number} keywordMatch - How well the resume matches industry keywords (0-100)
 * @property {Number} formattingScore - Score for resume formatting/structure (0-100)
 * @property {Number} contentScore - Score for content quality and relevance (0-100)
 */
const analysisSchema = new mongoose.Schema(
  {
    /**
     * Overall quality score for the resume on a 0-100 scale.
     * This is a weighted combination of keyword match, formatting,
     * and content scores. Higher scores indicate a stronger resume.
     */
    overallScore: {
      type: Number,
      min: [0, 'Score cannot be negative'],
      max: [100, 'Score cannot exceed 100'],
    },

    /**
     * Array of strings highlighting what the resume does well.
     * Example: ["Strong technical skills section", "Good use of action verbs"]
     * Positive reinforcement helps students understand what to keep.
     */
    strengths: {
      type: [String],
      default: [],
    },

    /**
     * Array of strings identifying areas that need improvement.
     * Example: ["Missing quantifiable achievements", "No projects section"]
     * These point out weaknesses without providing specific fixes.
     */
    improvements: {
      type: [String],
      default: [],
    },

    /**
     * Array of specific, actionable suggestions for improvement.
     * Example: ["Add 2-3 relevant projects with links", "Include GPA if above 7.0"]
     * These tell the student exactly WHAT to do to improve.
     */
    suggestions: {
      type: [String],
      default: [],
    },

    /**
     * Keyword match score (0-100) indicating how well the resume
     * aligns with common industry keywords and job descriptions.
     * Higher scores mean better ATS (Applicant Tracking System) compatibility.
     */
    keywordMatch: {
      type: Number,
      min: [0, 'Score cannot be negative'],
      max: [100, 'Score cannot exceed 100'],
    },

    /**
     * Formatting score (0-100) evaluating the resume's structure,
     * layout consistency, section organization, and visual clarity.
     * A well-formatted resume is easier for recruiters to scan.
     */
    formattingScore: {
      type: Number,
      min: [0, 'Score cannot be negative'],
      max: [100, 'Score cannot exceed 100'],
    },

    /**
     * Content quality score (0-100) assessing the relevance,
     * depth, and professionalism of the resume's written content.
     * Evaluates things like experience descriptions, skill relevance, etc.
     */
    contentScore: {
      type: Number,
      min: [0, 'Score cannot be negative'],
      max: [100, 'Score cannot exceed 100'],
    },
  },
  {
    _id: false, // No separate _id needed for the analysis sub-document
  }
);

/**
 * Main Resume Schema.
 *
 * @typedef {Object} ResumeSchema
 * @property {ObjectId} user - Reference to the student who uploaded the resume (required)
 * @property {String} originalText - Extracted text content from the uploaded file (required)
 * @property {String} fileName - Original name of the uploaded file
 * @property {Object} analysis - AI-generated analysis results
 * @property {Date} analyzedAt - When the analysis was performed
 */
const resumeSchema = new mongoose.Schema(
  {
    // ── User Reference ──────────────────────────────────────────────

    /**
     * Reference to the User who uploaded this resume.
     * Each student can have multiple resume analyses over time,
     * allowing them to track improvement.
     */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',       // Reference to the User model
      required: [true, 'User reference is required'],
    },

    // ── Resume Content ──────────────────────────────────────────────

    /**
     * The full text content extracted from the uploaded resume file.
     * Text extraction is performed server-side (e.g., using pdf-parse
     * for PDFs or mammoth for DOCX files).
     * This text is sent to Gemini AI for analysis.
     */
    originalText: {
      type: String,
      required: [true, 'Resume text content is required'],
    },

    /**
     * Original filename of the uploaded resume.
     * Preserved for reference and display purposes.
     * Example: "John_Doe_Resume_2026.pdf"
     */
    fileName: {
      type: String,
      trim: true,
    },

    // ── AI Analysis Results ─────────────────────────────────────────

    /**
     * Nested analysis object containing all AI-generated feedback.
     * This is populated after the Gemini AI processes the resume text.
     * Contains scores, strengths, improvements, and suggestions.
     */
    analysis: analysisSchema,

    // ── Metadata ────────────────────────────────────────────────────

    /**
     * Timestamp when the AI analysis was performed.
     * Defaults to the current time when the analysis document is created.
     * Useful for showing "Analyzed X days ago" in the UI.
     */
    analyzedAt: {
      type: Date,
      default: Date.now,
    },
  }
);

// ── Create and Export the Model ─────────────────────────────────────────
/**
 * Create the Resume model from the schema.
 * MongoDB will create a 'resumes' collection (lowercase, pluralized).
 */
const Resume = mongoose.model('Resume', resumeSchema);

module.exports = Resume;
