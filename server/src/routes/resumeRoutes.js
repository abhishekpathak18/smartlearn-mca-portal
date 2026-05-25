/**
 * Resume Routes - Proxies to aiController for resume operations
 * We keep this separate to match the app.js /api/resume prefix
 */

const express = require('express');
const router = express.Router();
const { analyzeResume } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

// POST /api/resume/analyze - Analyze a resume with AI
router.post('/analyze', protect, analyzeResume);

module.exports = router;
