/**
 * ============================================================================
 * NOTIFICATION CONTROLLER - Smart Learning & Placement Preparation Portal
 * ============================================================================
 * 
 * This controller manages user notifications:
 * - Get all notifications with pagination (newest first)
 * - Mark a single notification as read
 * - Mark all notifications as read (bulk operation)
 * - Get the count of unread notifications (for badge display)
 * 
 * Notifications are created by other controllers when events occur:
 * - Course enrollment (courseController)
 * - Test completion (testController)
 * - System announcements (adminController)
 * 
 * Notification types:
 * - 'enrollment' → User enrolled in a course
 * - 'test_result' → Test submitted and graded
 * - 'announcement' → System-wide or admin announcement
 * - 'achievement' → Badge or milestone achieved
 * - 'reminder' → Study or test reminder
 * 
 * @module controllers/notificationController
 * @requires mongoose models: Notification
 * ============================================================================
 */

// ─── Module Imports ─────────────────────────────────────────────────────────────
const Notification = require('../models/Notification');   // Notification Mongoose model
const mongoose = require('mongoose');                      // Mongoose for ObjectId validation

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Get all notifications for the logged-in user
 * @route   GET /api/notifications
 * @access  Private (requires authentication)
 * 
 * Returns a paginated list of notifications sorted by newest first.
 * Supports filtering by read/unread status and notification type.
 * 
 * @param {Object} req - Express request object
 * @param {number} [req.query.page=1] - Page number for pagination
 * @param {number} [req.query.limit=20] - Notifications per page (default: 20)
 * @param {string} [req.query.type] - Filter by notification type
 * @param {string} [req.query.read] - Filter: 'true' for read, 'false' for unread
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with paginated notifications and unread count
 */
const getNotifications = async (req, res) => {
  try {
    // ── Parse pagination parameters ──
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    // ── Build filter query ──
    // Always filter by the logged-in user's ID
    const filterQuery = { user: req.user.id };

    // Optional: Filter by notification type
    if (req.query.type) {
      filterQuery.type = req.query.type;
    }

    // Optional: Filter by read/unread status
    if (req.query.read === 'true') {
      filterQuery.isRead = true;
    } else if (req.query.read === 'false') {
      filterQuery.isRead = false;
    }

    // ── Execute queries in parallel for performance ──
    const [notifications, totalNotifications, unreadCount] = await Promise.all([
      // Fetch paginated notifications
      Notification.find(filterQuery)
        .sort({ createdAt: -1 })          // Newest notifications first
        .skip(skip)
        .limit(limit)
        .lean(),                           // Return plain JS objects (faster)

      // Count total matching notifications
      Notification.countDocuments(filterQuery),

      // Count unread notifications (always for the user, regardless of filters)
      Notification.countDocuments({
        user: req.user.id,
        isRead: false
      })
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalNotifications / limit);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          currentPage: page,
          totalPages,
          totalNotifications,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('[NOTIFICATION] Get notifications error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching notifications'
    });
  }
};

/**
 * @desc    Mark a single notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private (requires authentication)
 * 
 * Updates the isRead field of a specific notification to true.
 * Includes authorization check to ensure users can only mark
 * their own notifications as read.
 * 
 * @param {Object} req - Express request object
 * @param {string} req.params.id - The notification ID to mark as read
 * @param {Object} res - Express response object
 * @returns {Object} JSON response confirming the notification was marked as read
 */
const markAsRead = async (req, res) => {
  try {
    // Step 1: Validate notification ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid notification ID format'
      });
    }

    // Step 2: Find the notification and verify ownership
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    // Step 3: Authorization check - ensure the notification belongs to this user
    if (notification.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to modify this notification'
      });
    }

    // Step 4: Check if already read (idempotent operation)
    if (notification.isRead) {
      return res.status(200).json({
        success: true,
        message: 'Notification was already marked as read',
        data: notification
      });
    }

    // Step 5: Mark as read and save
    notification.isRead = true;
    notification.readAt = new Date();   // Track when it was read
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });

  } catch (error) {
    console.error('[NOTIFICATION] Mark as read error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error while updating notification'
    });
  }
};

/**
 * @desc    Mark all notifications as read for the logged-in user
 * @route   PUT /api/notifications/read-all
 * @access  Private (requires authentication)
 * 
 * Performs a bulk update to mark ALL unread notifications as read.
 * Uses MongoDB's updateMany for efficient batch processing.
 * This is triggered by a "Mark all as read" button in the UI.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with count of notifications marked as read
 */
const markAllAsRead = async (req, res) => {
  try {
    // Use updateMany for efficient bulk update
    // Only update notifications that are currently unread
    const updateResult = await Notification.updateMany(
      {
        user: req.user.id,      // Only this user's notifications
        isRead: false            // Only currently unread ones
      },
      {
        $set: {
          isRead: true,          // Mark as read
          readAt: new Date()     // Record the timestamp
        }
      }
    );

    // updateResult.modifiedCount tells us how many were actually updated
    const markedCount = updateResult.modifiedCount || 0;

    console.log(`[NOTIFICATION] Marked ${markedCount} notifications as read for user: ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: markedCount > 0
        ? `${markedCount} notification(s) marked as read`
        : 'No unread notifications to mark',
      data: {
        markedAsRead: markedCount
      }
    });

  } catch (error) {
    console.error('[NOTIFICATION] Mark all as read error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error while updating notifications'
    });
  }
};

/**
 * @desc    Get the count of unread notifications for the logged-in user
 * @route   GET /api/notifications/unread-count
 * @access  Private (requires authentication)
 * 
 * Returns just the count of unread notifications. This is a lightweight
 * endpoint designed for the notification badge/indicator in the UI header.
 * It's called frequently (e.g., on every page load or via polling) so
 * it returns minimal data for performance.
 * 
 * Uses countDocuments which is more efficient than fetching all unread
 * notifications and counting them in application code.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with unread notification count
 */
const getUnreadCount = async (req, res) => {
  try {
    // countDocuments is a MongoDB operation that counts matching documents
    // without fetching them - very efficient for just getting a count
    const unreadCount = await Notification.countDocuments({
      user: req.user.id,
      isRead: false
    });

    res.status(200).json({
      success: true,
      data: {
        unreadCount
      }
    });

  } catch (error) {
    console.error('[NOTIFICATION] Get unread count error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching unread count'
    });
  }
};

// ─── Export All Controller Functions ────────────────────────────────────────────
module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
};
