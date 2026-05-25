/**
 * @fileoverview Notification Routes
 * 
 * This file defines all notification-related API routes for the Smart Learning Portal.
 * All routes require authentication. Handles listing notifications,
 * marking them as read (individually or all at once), and getting unread counts.
 * 
 * Route Prefix: /api/notifications
 * 
 * @module routes/notificationRoutes
 * @requires express
 * @requires ../controllers/notificationController
 * @requires ../middleware/auth
 */

const express = require('express');

// ============================================================
// Import Controller Functions
// Each handles notification-related business logic
// ============================================================
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
} = require('../controllers/notificationController');

// ============================================================
// Import Middleware
// - protect: Ensures user has a valid JWT token
// ============================================================
const { protect } = require('../middleware/auth');

// ============================================================
// Create Express Router Instance
// This router will be mounted at /api/notifications in the main app
// ============================================================
const router = express.Router();

// ============================================================
// Apply Authentication Middleware to ALL Routes
// Notifications are private - only viewable by their owner
// ============================================================
router.use(protect);

// ============================================================
// Route Definitions
// ============================================================

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for the authenticated user
 * @access  Private
 * @query   { page: number, limit: number, read: boolean }
 * @returns { success: true, data: { notifications, pagination } }
 * 
 * @note    Notifications are sorted by creation date (newest first).
 *          Supports filtering by read/unread status via the 'read' query param.
 * 
 * @example
 * GET /api/notifications?page=1&limit=20&read=false  // Get unread only
 */
router.get('/', getNotifications);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark a single notification as read
 * @access  Private
 * @param   {string} id - MongoDB ObjectId of the notification
 * @returns { success: true, data: { notification } }
 * 
 * @note    Only the notification owner can mark it as read.
 *          The controller should verify ownership before updating.
 */
router.put('/:id/read', markAsRead);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read for the authenticated user
 * @access  Private
 * @returns { success: true, message: 'All notifications marked as read', data: { modifiedCount } }
 * 
 * @note    This performs a bulk update operation on all unread notifications
 *          belonging to the authenticated user. Useful for "mark all as read" UI feature.
 */
router.put('/read-all', markAllAsRead);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get the count of unread notifications for the authenticated user
 * @access  Private
 * @returns { success: true, data: { count: number } }
 * 
 * @note    This is a lightweight endpoint designed to be polled frequently
 *          (e.g., every 30 seconds) or used with real-time updates to show
 *          the notification badge count in the UI header.
 */
router.get('/unread-count', getUnreadCount);

// Export the router for mounting in the main Express app
module.exports = router;
