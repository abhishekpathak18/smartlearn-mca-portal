/**
 * ============================================================================
 * Notification Model - Smart Learning & Placement Preparation Portal
 * ============================================================================
 *
 * This model manages in-app notifications for users.
 * Notifications are created for events like:
 *   - New course published
 *   - Test results available
 *   - Resume analysis complete
 *   - System announcements
 *   - Achievement milestones
 *
 * Features:
 *   - Type-based classification (info, success, warning, alert)
 *   - Read/unread status tracking
 *   - Optional deep-link to related resources
 *   - Automatic timestamps for sorting
 *
 * @module models/Notification
 * @requires mongoose
 */

const mongoose = require('mongoose');

/**
 * Notification Schema.
 *
 * @typedef {Object} NotificationSchema
 * @property {ObjectId} user - Reference to the user receiving the notification (required)
 * @property {String} title - Short notification title (required)
 * @property {String} message - Detailed notification message (required)
 * @property {String} type - Notification type: info, success, warning, or alert
 * @property {Boolean} isRead - Whether the user has read/seen the notification
 * @property {String} link - Optional URL/route for the notification action
 */
const notificationSchema = new mongoose.Schema(
  {
    // ── Target User ─────────────────────────────────────────────────

    /**
     * Reference to the User who should receive this notification.
     * Each notification is targeted to a specific user.
     * For broadcast notifications, create one document per user.
     */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',       // Reference to the User model
      required: [true, 'User reference is required'],
    },

    // ── Notification Content ────────────────────────────────────────

    /**
     * Short title for the notification — displayed as the heading.
     * Should be concise and descriptive.
     * Example: "Test Results Available"
     */
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    /**
     * Detailed notification message — displayed as the body.
     * Provides more context about the notification event.
     * Example: "Your DSA Mock Test results are ready. You scored 85%!"
     */
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },

    // ── Notification Type ───────────────────────────────────────────

    /**
     * Type of notification determines the visual styling in the UI:
     *   - 'info': General information (blue icon/badge)
     *   - 'success': Positive outcome (green icon/badge)
     *   - 'warning': Attention needed (yellow/orange icon/badge)
     *   - 'alert': Critical/urgent notification (red icon/badge)
     */
    type: {
      type: String,
      enum: {
        values: ['info', 'success', 'warning', 'alert'],
        message: 'Type must be info, success, warning, or alert',
      },
      default: 'info',
    },

    // ── Read Status ─────────────────────────────────────────────────

    /**
     * Tracks whether the user has read/acknowledged this notification.
     * Defaults to false (unread) when the notification is created.
     * Updated to true when the user views or clicks the notification.
     * Used to show unread count badge in the UI navbar.
     */
    isRead: {
      type: Boolean,
      default: false,
    },

    // ── Action Link ─────────────────────────────────────────────────

    /**
     * Optional URL or frontend route that the notification links to.
     * When clicked, the user is navigated to this resource.
     * Example: "/tests/results/664a1b2c3d4e5f6a7b8c9d0e"
     * If null, the notification is informational only.
     */
    link: {
      type: String,
    },
  },
  {
    /**
     * Automatically adds createdAt and updatedAt timestamps.
     * createdAt is particularly useful for:
     *   - Sorting notifications (newest first)
     *   - Displaying "2 hours ago" relative timestamps
     */
    timestamps: true,
  }
);

// ── Create and Export the Model ─────────────────────────────────────────
/**
 * Create the Notification model from the schema.
 * MongoDB will create a 'notifications' collection (lowercase, pluralized).
 */
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
