/**
 * ============================================================================
 * ActivityLog Model - Smart Learning & Placement Preparation Portal
 * ============================================================================
 *
 * This model provides an audit trail of user actions on the platform.
 * Every significant action is logged for:
 *   - Security monitoring (login attempts, password changes)
 *   - Usage analytics (feature usage patterns)
 *   - Debugging (tracking user-reported issues)
 *   - Compliance (maintaining an audit trail)
 *
 * Logged actions include:
 *   - User login/logout
 *   - Test submissions
 *   - Course enrollment
 *   - Resume uploads
 *   - Profile updates
 *   - Admin actions (creating courses, tests, etc.)
 *
 * The `user` field is optional to support logging actions from
 * unauthenticated users (e.g., failed login attempts).
 *
 * @module models/ActivityLog
 * @requires mongoose
 */

const mongoose = require('mongoose');

/**
 * ActivityLog Schema.
 *
 * @typedef {Object} ActivityLogSchema
 * @property {ObjectId} user - Reference to the user who performed the action (optional)
 * @property {String} action - Description of the action performed (required)
 * @property {String} details - Additional details or context about the action
 * @property {String} ipAddress - IP address from which the action was performed
 * @property {String} userAgent - Browser/client user agent string
 */
const activityLogSchema = new mongoose.Schema(
  {
    // ── User Reference ──────────────────────────────────────────────

    /**
     * Reference to the User who performed the action.
     * This field is OPTIONAL (not required) because:
     *   - Failed login attempts don't have an authenticated user
     *   - System-generated events may not be tied to a user
     *   - Registration events happen before the user document exists
     */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
    },

    // ── Action Details ──────────────────────────────────────────────

    /**
     * Short description of the action performed.
     * Should follow a consistent naming convention for easy filtering.
     * Examples:
     *   - "USER_LOGIN" / "USER_LOGOUT"
     *   - "TEST_SUBMITTED"
     *   - "COURSE_ENROLLED"
     *   - "RESUME_UPLOADED"
     *   - "PROFILE_UPDATED"
     *   - "PASSWORD_CHANGED"
     *   - "COURSE_CREATED" (admin)
     */
    action: {
      type: String,
      required: [true, 'Action description is required'],
      trim: true,
    },

    /**
     * Additional context or metadata about the action.
     * Can contain structured information as a string.
     * Examples:
     *   - "Test ID: 664a1b2c..., Score: 85%"
     *   - "Course: Introduction to React"
     *   - "Login failed: invalid password"
     */
    details: {
      type: String,
      trim: true,
    },

    // ── Request Metadata ────────────────────────────────────────────

    /**
     * IP address of the client that performed the action.
     * Extracted from the Express request object (req.ip or req.headers['x-forwarded-for']).
     * Used for security monitoring and detecting suspicious activity.
     * Example: "192.168.1.100" or "2001:db8::1" (IPv6)
     */
    ipAddress: {
      type: String,
      trim: true,
    },

    /**
     * User agent string from the client's browser or HTTP client.
     * Extracted from req.headers['user-agent'].
     * Useful for identifying the device/browser used.
     * Example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0..."
     */
    userAgent: {
      type: String,
      trim: true,
    },
  },
  {
    /**
     * Automatically adds createdAt and updatedAt timestamps.
     * createdAt serves as the "when did this action happen" timestamp.
     * This is crucial for:
     *   - Chronological activity feeds
     *   - Time-based filtering ("actions in the last 24 hours")
     *   - Security audit timelines
     */
    timestamps: true,
  }
);

// ── Create and Export the Model ─────────────────────────────────────────
/**
 * Create the ActivityLog model from the schema.
 * MongoDB will create an 'activitylogs' collection (lowercase, pluralized).
 */
const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
