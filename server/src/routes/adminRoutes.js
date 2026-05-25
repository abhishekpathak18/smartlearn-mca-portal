const express = require('express');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');
const { validate } = require('../middleware/validate');
const { body } = require('express-validator');
const {
  getDashboardStats, getAllUsers, updateUser, deleteUser,
  createCourse, updateCourse, deleteCourse,
  createTest, updateTest, deleteTest,
  getPlatformAnalytics, getActivityLogs
} = require('../controllers/adminController');

const router = express.Router();
router.use(protect);
router.use(isAdmin);

// Dashboard
router.get('/dashboard', getDashboardStats);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Course management
router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

// Test management
router.post('/tests', createTest);
router.put('/tests/:id', updateTest);
router.delete('/tests/:id', deleteTest);

// Analytics & Logs
router.get('/analytics', getPlatformAnalytics);
router.get('/activity-logs', getActivityLogs);

module.exports = router;
