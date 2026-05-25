const express = require('express');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { body } = require('express-validator');
const { getTests, getTest, submitTest, getTestResults } = require('../controllers/testController');

const router = express.Router();
router.use(protect);

const submitTestValidation = [
  body('answers').isArray({ min: 1 }).withMessage('Answers must be a non-empty array'),
];

router.get('/', getTests);
router.get('/:id', getTest);
router.post('/:id/submit', submitTest);
router.get('/:id/results', getTestResults);

module.exports = router;
