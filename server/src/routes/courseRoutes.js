const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { getCourses, getCourse, enrollCourse, getEnrolledCourses, rateCourse } = require('../controllers/courseController');

const router = express.Router();

const rateCourseValidation = [
  body('rating').notEmpty().withMessage('Rating is required').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().trim().isLength({ max: 1000 }).withMessage('Review cannot exceed 1000 characters')
];

// Public routes
router.get('/', getCourses);
router.get('/:id', getCourse);

// Protected routes
router.post('/:id/enroll', protect, enrollCourse);
router.get('/user/enrolled', protect, getEnrolledCourses);
router.post('/:id/rate', protect, rateCourseValidation, validate, rateCourse);

module.exports = router;
