const express = require('express');
const { protect } = require('../middleware/auth');
const { getMyResults, getResultById, exportResultPDF } = require('../controllers/resultController');

const router = express.Router();
router.use(protect);

router.get('/', getMyResults);
router.get('/export/pdf/:id', exportResultPDF);
router.get('/:id', getResultById);

module.exports = router;
