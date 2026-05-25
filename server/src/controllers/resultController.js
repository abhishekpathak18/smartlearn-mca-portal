/**
 * ============================================================================
 * RESULT CONTROLLER - Smart Learning & Placement Preparation Portal
 * ============================================================================
 * 
 * This controller manages test result operations:
 * - View all results for the logged-in user (history)
 * - View a specific result with detailed breakdown
 * - Export a result as a PDF document (downloadable report)
 * 
 * Results are created by the testController when a test is submitted.
 * This controller is focused on reading/viewing those results.
 * 
 * PDF Export:
 * Uses the pdfkit library to dynamically generate PDF documents.
 * The PDF includes test title, score, percentage, pass/fail status,
 * and a question-by-question breakdown with correct/incorrect indicators.
 * The PDF is streamed directly to the client (piped to response).
 * 
 * @module controllers/resultController
 * @requires mongoose models: Result
 * @requires pdfkit for PDF generation
 * ============================================================================
 */

// ─── Module Imports ─────────────────────────────────────────────────────────────
const Result = require('../models/Result');   // Result model for test outcomes
const PDFDocument = require('pdfkit');         // PDF generation library
const mongoose = require('mongoose');          // Mongoose for ObjectId validation

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Get all test results for the logged-in user
 * @route   GET /api/results
 * @access  Private (requires authentication)
 * 
 * Returns a paginated list of all test results belonging to the
 * currently authenticated user. Includes basic test information
 * (title, category) via population.
 * 
 * Supports:
 * - Pagination (page, limit)
 * - Sorting (default: newest first)
 * - Filtering by passed/failed status
 * 
 * @param {Object} req - Express request object
 * @param {number} [req.query.page=1] - Page number
 * @param {number} [req.query.limit=10] - Results per page
 * @param {string} [req.query.status] - Filter: 'passed' or 'failed'
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with paginated results array
 */
const getMyResults = async (req, res) => {
  try {
    // ── Parse pagination parameters ──
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;

    // ── Build filter query ──
    const filterQuery = { user: req.user.id };

    // Optional: Filter by pass/fail status
    if (req.query.status === 'passed') {
      filterQuery.passed = true;
    } else if (req.query.status === 'failed') {
      filterQuery.passed = false;
    }

    // ── Execute queries in parallel ──
    const [results, totalResults] = await Promise.all([
      Result.find(filterQuery)
        .sort({ createdAt: -1 })            // Newest results first
        .skip(skip)
        .limit(limit)
        .populate('test', 'title category difficulty type')  // Include test info
        .select('-answers')                  // Exclude detailed answers in list view (performance)
        .lean(),

      Result.countDocuments(filterQuery)
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalResults / limit);

    // Calculate summary statistics across all results
    const summaryStats = await Result.aggregate([
      { $match: { user: req.user.id } },
      {
        $group: {
          _id: null,
          averageScore: { $avg: '$percentage' },
          totalTests: { $sum: 1 },
          totalPassed: { $sum: { $cond: ['$passed', 1, 0] } }  // Count passed tests
        }
      }
    ]);

    const stats = summaryStats[0] || {
      averageScore: 0,
      totalTests: 0,
      totalPassed: 0
    };

    res.status(200).json({
      success: true,
      data: {
        results,
        summary: {
          averageScore: Math.round(stats.averageScore * 100) / 100,
          totalTests: stats.totalTests,
          totalPassed: stats.totalPassed,
          passRate: stats.totalTests > 0
            ? Math.round((stats.totalPassed / stats.totalTests) * 100)
            : 0
        },
        pagination: {
          currentPage: page,
          totalPages,
          totalResults,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('[RESULT] Get my results error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching results'
    });
  }
};

/**
 * @desc    Get a specific result by ID with full question breakdown
 * @route   GET /api/results/:id
 * @access  Private (requires authentication)
 * 
 * Returns the complete result document including the detailed
 * per-question breakdown (selected answer, correct answer, explanation).
 * Only the result owner can view their results (authorization check).
 * 
 * @param {Object} req - Express request object
 * @param {string} req.params.id - The MongoDB ObjectId of the result
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with the complete result data
 */
const getResultById = async (req, res) => {
  try {
    // Step 1: Validate the result ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid result ID format'
      });
    }

    // Step 2: Find the result and populate test information
    const result = await Result.findById(req.params.id)
      .populate('test', 'title category difficulty type description duration')
      .populate('user', 'name email');

    // Step 3: Check if result exists
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Result not found'
      });
    }

    // Step 4: Authorization check - ensure the logged-in user owns this result
    // Admins can also view any result (for moderation/support)
    if (result.user._id.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to view this result'
      });
    }

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('[RESULT] Get result by ID error:', error.message);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid result ID format'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error while fetching result'
    });
  }
};

/**
 * @desc    Export a test result as a downloadable PDF document
 * @route   GET /api/results/:id/pdf
 * @access  Private (requires authentication)
 * 
 * Generates a professionally formatted PDF report containing:
 * - Report header with title and date
 * - Student information (name, email)
 * - Test information (title, category, difficulty)
 * - Score summary (score, percentage, pass/fail, time taken)
 * - Question-by-question breakdown with ✓/✗ indicators
 * 
 * The PDF is generated using pdfkit and streamed directly to the
 * client's browser. The Content-Type header is set to 'application/pdf'
 * and Content-Disposition triggers a file download.
 * 
 * @param {Object} req - Express request object
 * @param {string} req.params.id - The result ID to export as PDF
 * @param {Object} res - Express response object
 * @returns {Stream} PDF file stream piped to the response
 */
const exportResultPDF = async (req, res) => {
  try {
    // Step 1: Validate the result ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid result ID format'
      });
    }

    // Step 2: Fetch the result with all related data
    const result = await Result.findById(req.params.id)
      .populate('test', 'title category difficulty type')
      .populate('user', 'name email');

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Result not found'
      });
    }

    // Step 3: Authorization check
    if (result.user._id.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to export this result'
      });
    }

    // ── Step 4: Create PDF Document ──
    // pdfkit creates a writable stream that we can pipe to the response
    const doc = new PDFDocument({
      size: 'A4',                    // Standard A4 paper size
      margins: {                     // Page margins in points (72 points = 1 inch)
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      },
      info: {
        Title: `Test Result - ${result.test ? result.test.title : 'Unknown'}`,
        Author: 'Smart Learning Portal',
        Subject: 'Test Result Report'
      }
    });

    // ── Step 5: Set response headers for PDF download ──
    const filename = `result_${result._id}_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe the PDF document stream directly to the HTTP response
    // This means the PDF is sent to the client as it's being generated
    doc.pipe(res);

    // ── Step 6: Build PDF Content ──

    // --- Header Section ---
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('Smart Learning Portal', { align: 'center' })
      .fontSize(16)
      .text('Test Result Report', { align: 'center' })
      .moveDown(0.5);

    // Horizontal divider line
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor('#3498db')
      .lineWidth(2)
      .stroke()
      .moveDown(1);

    // --- Student Information ---
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Student Information', { underline: true })
      .moveDown(0.3)
      .font('Helvetica')
      .text(`Name: ${result.user ? result.user.name : 'N/A'}`)
      .text(`Email: ${result.user ? result.user.email : 'N/A'}`)
      .text(`Date: ${new Date(result.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`)
      .moveDown(1);

    // --- Test Information ---
    doc
      .font('Helvetica-Bold')
      .text('Test Details', { underline: true })
      .moveDown(0.3)
      .font('Helvetica')
      .text(`Test: ${result.test ? result.test.title : 'N/A'}`)
      .text(`Category: ${result.test ? result.test.category : 'N/A'}`)
      .text(`Difficulty: ${result.test ? result.test.difficulty : 'N/A'}`)
      .moveDown(1);

    // --- Score Summary ---
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .text('Score Summary', { underline: true })
      .moveDown(0.3)
      .fontSize(12);

    // Score with color coding (green for pass, red for fail)
    const scoreColor = result.passed ? '#27ae60' : '#e74c3c';
    doc
      .font('Helvetica')
      .text(`Score: ${result.score} / ${result.totalQuestions}`)
      .fillColor(scoreColor)
      .font('Helvetica-Bold')
      .text(`Percentage: ${result.percentage}%`)
      .text(`Status: ${result.passed ? '✓ PASSED' : '✗ FAILED'}`)
      .fillColor('#000000')   // Reset color to black
      .font('Helvetica')
      .text(`Time Taken: ${result.timeTaken ? `${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s` : 'N/A'}`)
      .moveDown(1.5);

    // --- Question Breakdown ---
    if (result.answers && result.answers.length > 0) {
      doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .text('Question-by-Question Breakdown', { underline: true })
        .moveDown(0.5)
        .fontSize(10);

      // Loop through each question result
      result.answers.forEach((answer, index) => {
        // Check if we need a new page (leave 100 points margin at bottom)
        if (doc.y > 700) {
          doc.addPage();
        }

        // Question number and status indicator
        const statusIcon = answer.isCorrect ? '✓' : '✗';
        const statusColor = answer.isCorrect ? '#27ae60' : '#e74c3c';

        doc
          .fillColor(statusColor)
          .font('Helvetica-Bold')
          .text(`${statusIcon} Q${index + 1}: ${answer.questionText || 'Question ' + (index + 1)}`, {
            width: 480
          })
          .fillColor('#000000')
          .font('Helvetica')
          .text(`   Your Answer: ${answer.selectedOption || 'Not answered'}`)
          .text(`   Correct Answer: ${answer.correctAnswer}`)
          .moveDown(0.5);
      });
    }

    // --- Footer ---
    doc.moveDown(2);
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor('#bdc3c7')
      .lineWidth(1)
      .stroke()
      .moveDown(0.5);

    doc
      .fontSize(8)
      .fillColor('#7f8c8d')
      .text(
        'This report was generated by Smart Learning & Placement Preparation Portal. ' +
        `Generated on: ${new Date().toLocaleDateString('en-IN')}`,
        { align: 'center' }
      );

    // ── Step 7: Finalize the PDF ──
    // doc.end() signals that we're done adding content
    // The piped response will automatically end when the PDF is complete
    doc.end();

    console.log(`[RESULT] PDF exported for result: ${result._id} by user: ${req.user.id}`);

  } catch (error) {
    console.error('[RESULT] Export PDF error:', error.message);

    // Check if headers have already been sent (PDF streaming started)
    // If so, we can't send a JSON error response
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Server error while generating PDF'
      });
    }
  }
};

// ─── Export All Controller Functions ────────────────────────────────────────────
module.exports = {
  getMyResults,
  getResultById,
  exportResultPDF
};
