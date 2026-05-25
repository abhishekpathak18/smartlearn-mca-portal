const express = require('express');
const { protect } = require('../middleware/auth');
const { getUserAnalytics, getPerformanceTrend, getTopicStrengths } = require('../controllers/analyticsController');

const router = express.Router();
router.use(protect);

router.get('/', getUserAnalytics);
router.get('/trend', getPerformanceTrend);
router.get('/topics', getTopicStrengths);

module.exports = router;
