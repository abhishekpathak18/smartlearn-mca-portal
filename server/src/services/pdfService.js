/**
 * @fileoverview PDF Service - Test Result PDF Generation
 * 
 * This service generates professional PDF documents for test results
 * using the PDFKit library. The generated PDFs include:
 * - Branded header with portal name and logo
 * - User information section
 * - Test details and score summary
 * - Question-by-question breakdown with correct/incorrect indicators
 * - Topic-wise performance analysis
 * - Footer with generation timestamp
 * 
 * The PDF is returned as a stream that can be piped directly to the
 * HTTP response for download.
 * 
 * @module services/pdfService
 * @requires pdfkit
 */

const PDFDocument = require('pdfkit');

// ============================================================
// PDF Configuration Constants
// ============================================================

/** @const {Object} COLOR - Brand color palette for the PDF */
const COLOR = {
  primary: '#667eea',       // Purple-blue - headers and accents
  secondary: '#764ba2',     // Deep purple - gradients
  success: '#28a745',       // Green - correct answers
  danger: '#dc3545',        // Red - incorrect answers
  warning: '#ffc107',       // Yellow - warnings
  dark: '#333333',          // Dark gray - main text
  muted: '#666666',         // Medium gray - secondary text
  light: '#f8f9fa',         // Light gray - backgrounds
  border: '#dee2e6',        // Border color
  white: '#ffffff'          // White
};

/** @const {Object} FONT_SIZE - Consistent font sizes throughout the PDF */
const FONT_SIZE = {
  title: 22,
  subtitle: 16,
  heading: 14,
  body: 11,
  small: 9,
  caption: 8
};

// ============================================================
// PDF Helper Functions
// ============================================================

/**
 * Draw a horizontal separator line across the page.
 * Used to visually separate sections of the PDF.
 * 
 * @param {PDFDocument} doc - The PDFKit document instance
 * @param {number} [y] - Y position for the line (defaults to current Y)
 * @param {string} [color='#dee2e6'] - Line color
 */
const drawSeparator = (doc, y, color = COLOR.border) => {
  const currentY = y || doc.y;
  doc
    .strokeColor(color)
    .lineWidth(1)
    .moveTo(50, currentY)
    .lineTo(545, currentY)
    .stroke();
  doc.moveDown(0.5);
};

/**
 * Draw a colored rectangle background for section headers.
 * Creates a visually distinct header bar for each section.
 * 
 * @param {PDFDocument} doc - The PDFKit document instance
 * @param {string} text - The section header text
 * @param {string} [bgColor='#667eea'] - Background color of the header bar
 */
const drawSectionHeader = (doc, text, bgColor = COLOR.primary) => {
  const y = doc.y;

  // Draw the background rectangle
  doc
    .rect(50, y, 495, 25)
    .fill(bgColor);

  // Draw the text on top of the rectangle
  doc
    .fillColor(COLOR.white)
    .fontSize(FONT_SIZE.heading)
    .text(text, 60, y + 6, { width: 475 });

  // Reset fill color and move down
  doc
    .fillColor(COLOR.dark)
    .moveDown(1);
};

/**
 * Add a key-value information row (e.g., "Name: John Doe").
 * Used for displaying structured data like user info and test details.
 * 
 * @param {PDFDocument} doc - The PDFKit document instance
 * @param {string} label - The label/key text
 * @param {string} value - The value text
 * @param {number} [labelWidth=140] - Width allocated for the label
 */
const addInfoRow = (doc, label, value, labelWidth = 140) => {
  const y = doc.y;
  doc
    .fontSize(FONT_SIZE.body)
    .fillColor(COLOR.muted)
    .text(label, 60, y, { width: labelWidth, continued: false });

  doc
    .fillColor(COLOR.dark)
    .text(String(value), 60 + labelWidth, y, { width: 495 - labelWidth });
};

// ============================================================
// Main PDF Generation Function
// ============================================================

/**
 * Generate a professional PDF report for a test result.
 * 
 * Creates a comprehensive, well-formatted PDF document that includes
 * all relevant information about a user's test attempt. The PDF is
 * designed to look professional for printing or sharing.
 * 
 * @param {Object} result - The test result data from the database
 * @param {string} result._id - Result document ID
 * @param {number} result.score - Score percentage (0-100)
 * @param {number} result.totalQuestions - Total number of questions
 * @param {number} result.correctAnswers - Number of correct answers
 * @param {number} result.wrongAnswers - Number of incorrect answers
 * @param {boolean} result.passed - Whether the user passed
 * @param {number} result.timeSpent - Time spent in seconds
 * @param {Date} result.completedAt - When the test was completed
 * @param {Array<Object>} result.answers - Detailed answer breakdown
 * @param {Object} user - The user who took the test
 * @param {string} user.name - User's full name
 * @param {string} user.email - User's email address
 * @param {Object} test - The test document
 * @param {string} test.title - Test title
 * @param {string} test.category - Test category
 * @param {string} test.difficulty - Test difficulty level
 * @param {number} test.duration - Test duration in minutes
 * @param {Array<Object>} test.questions - Test questions array
 * @returns {PDFDocument} PDFKit document stream ready to be piped to response
 * 
 * @example
 * // In a controller:
 * const doc = generateResultPDF(result, user, test);
 * res.setHeader('Content-Type', 'application/pdf');
 * res.setHeader('Content-Disposition', `attachment; filename=result-${result._id}.pdf`);
 * doc.pipe(res);
 * doc.end();
 */
const generateResultPDF = (result, user, test) => {
  // ============================================================
  // Create a new PDF document with custom settings
  // ============================================================
  const doc = new PDFDocument({
    size: 'A4',          // Standard A4 paper size
    margins: {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50
    },
    info: {
      Title: `Test Result - ${test.title}`,
      Author: 'SmartLearn Portal',
      Subject: 'Test Result Report',
      Creator: 'SmartLearn PDF Service'
    },
    bufferPages: true // Enable page buffering for page numbers
  });

  // ============================================================
  // PAGE 1: Header Section
  // Portal branding with title and decorative elements
  // ============================================================

  // Draw header background rectangle
  doc
    .rect(0, 0, 595, 100)
    .fill(COLOR.primary);

  // Portal title in the header
  doc
    .fillColor(COLOR.white)
    .fontSize(FONT_SIZE.title)
    .text('🎓 SmartLearn Portal', 50, 25, { align: 'center' });

  // Subtitle
  doc
    .fontSize(FONT_SIZE.body)
    .text('AI-Powered Learning & Placement Preparation', 50, 52, { align: 'center' });

  // Report type label
  doc
    .fontSize(FONT_SIZE.small)
    .text('TEST RESULT REPORT', 50, 72, { align: 'center' });

  // Reset position below header
  doc.fillColor(COLOR.dark);
  doc.y = 120;

  // ============================================================
  // User Information Section
  // ============================================================
  drawSectionHeader(doc, '👤 Student Information');

  addInfoRow(doc, 'Name:', user.name);
  addInfoRow(doc, 'Email:', user.email);
  addInfoRow(doc, 'Report Generated:', new Date().toLocaleDateString('en-IN', {
    dateStyle: 'full'
  }));

  doc.moveDown(0.5);
  drawSeparator(doc);

  // ============================================================
  // Test Details Section
  // ============================================================
  drawSectionHeader(doc, '📋 Test Details');

  addInfoRow(doc, 'Test Title:', test.title);
  addInfoRow(doc, 'Category:', test.category || 'General');
  addInfoRow(doc, 'Difficulty:', (test.difficulty || 'Medium').charAt(0).toUpperCase() + (test.difficulty || 'medium').slice(1));
  addInfoRow(doc, 'Duration:', `${test.duration || 'N/A'} minutes`);
  addInfoRow(doc, 'Total Questions:', String(result.totalQuestions));
  addInfoRow(doc, 'Completed On:', new Date(result.completedAt).toLocaleDateString('en-IN', {
    dateStyle: 'long',
    timeStyle: 'short'
  }));

  doc.moveDown(0.5);
  drawSeparator(doc);

  // ============================================================
  // Score Summary Section (Visual Box)
  // ============================================================
  drawSectionHeader(doc, '🏆 Score Summary', result.passed ? '#28a745' : '#dc3545');

  const scoreY = doc.y;

  // Score display box - centered, large font
  doc
    .rect(180, scoreY, 235, 70)
    .lineWidth(2)
    .strokeColor(result.passed ? COLOR.success : COLOR.danger)
    .fillAndStroke(COLOR.light, result.passed ? COLOR.success : COLOR.danger);

  // Score percentage - large and bold
  doc
    .fillColor(result.passed ? COLOR.success : COLOR.danger)
    .fontSize(28)
    .text(`${result.score}%`, 180, scoreY + 8, { width: 235, align: 'center' });

  // Pass/Fail status
  doc
    .fontSize(FONT_SIZE.heading)
    .text(result.passed ? '✅ PASSED' : '❌ NEEDS IMPROVEMENT', 180, scoreY + 45, {
      width: 235,
      align: 'center'
    });

  doc.y = scoreY + 85;
  doc.fillColor(COLOR.dark);

  // Score breakdown in a table-like format
  const breakdownY = doc.y;

  // Correct answers
  doc
    .fontSize(FONT_SIZE.body)
    .fillColor(COLOR.success)
    .text(`✅ Correct: ${result.correctAnswers}`, 60, breakdownY);

  // Wrong answers
  doc
    .fillColor(COLOR.danger)
    .text(`❌ Wrong: ${result.wrongAnswers || (result.totalQuestions - result.correctAnswers)}`, 220, breakdownY);

  // Time spent
  const minutes = Math.floor((result.timeSpent || 0) / 60);
  const seconds = (result.timeSpent || 0) % 60;
  doc
    .fillColor(COLOR.muted)
    .text(`🕐 Time: ${minutes}m ${seconds}s`, 380, breakdownY);

  doc.fillColor(COLOR.dark);
  doc.moveDown(1.5);
  drawSeparator(doc);

  // ============================================================
  // Question-by-Question Breakdown
  // ============================================================
  drawSectionHeader(doc, '📝 Question-by-Question Analysis');

  // Iterate through each answer in the result
  if (result.answers && result.answers.length > 0) {
    result.answers.forEach((answer, index) => {
      // Check if we need a new page (prevent content from being cut off)
      if (doc.y > 680) {
        doc.addPage();
        doc.y = 50;
      }

      // Find the corresponding question from the test
      const question = test.questions ? test.questions[index] : null;
      const isCorrect = answer.isCorrect;

      // Question number and status indicator
      const qY = doc.y;

      // Status indicator (colored dot)
      doc
        .circle(65, qY + 6, 5)
        .fill(isCorrect ? COLOR.success : COLOR.danger);

      // Question text
      doc
        .fillColor(COLOR.dark)
        .fontSize(FONT_SIZE.body)
        .text(
          `Q${index + 1}. ${question ? question.question : (answer.questionText || 'Question')}`,
          80, qY,
          { width: 455 }
        );

      doc.moveDown(0.3);

      // User's answer
      doc
        .fontSize(FONT_SIZE.small)
        .fillColor(isCorrect ? COLOR.success : COLOR.danger)
        .text(`Your Answer: ${answer.selectedAnswer || answer.selectedOption || 'N/A'}`, 80);

      // Correct answer (shown only for wrong answers to help learning)
      if (!isCorrect) {
        doc
          .fillColor(COLOR.success)
          .text(`Correct Answer: ${answer.correctAnswer || 'N/A'}`, 80);
      }

      // Explanation (if available)
      if (answer.explanation || (question && question.explanation)) {
        doc
          .fillColor(COLOR.muted)
          .fontSize(FONT_SIZE.caption)
          .text(`💡 ${answer.explanation || question.explanation}`, 80, doc.y, { width: 455 });
      }

      doc.fillColor(COLOR.dark);
      doc.moveDown(0.8);

      // Light separator between questions
      if (index < result.answers.length - 1) {
        doc
          .strokeColor('#eee')
          .lineWidth(0.5)
          .moveTo(80, doc.y)
          .lineTo(545, doc.y)
          .stroke();
        doc.moveDown(0.5);
      }
    });
  } else {
    // Fallback when detailed answers are not available
    doc
      .fontSize(FONT_SIZE.body)
      .fillColor(COLOR.muted)
      .text('Detailed question breakdown is not available for this result.', 60);
    doc.moveDown(1);
  }

  // ============================================================
  // Topic-Wise Performance (if available)
  // ============================================================
  if (result.topicWiseScore && Object.keys(result.topicWiseScore).length > 0) {
    // New page if running low on space
    if (doc.y > 600) {
      doc.addPage();
      doc.y = 50;
    }

    drawSeparator(doc);
    drawSectionHeader(doc, '📊 Topic-Wise Performance');

    // Table header
    const tableHeaderY = doc.y;
    doc
      .rect(50, tableHeaderY, 495, 22)
      .fill('#f0f0f0');

    doc
      .fillColor(COLOR.dark)
      .fontSize(FONT_SIZE.small)
      .text('Topic', 60, tableHeaderY + 6, { width: 200 })
      .text('Score', 280, tableHeaderY + 6, { width: 80 })
      .text('Accuracy', 380, tableHeaderY + 6, { width: 80 });

    doc.y = tableHeaderY + 28;

    // Table rows for each topic
    Object.entries(result.topicWiseScore).forEach(([topic, data]) => {
      const rowY = doc.y;
      const score = typeof data === 'object' ? data.score : data;
      const accuracy = typeof data === 'object' ? data.accuracy : `${data}%`;

      doc
        .fontSize(FONT_SIZE.small)
        .fillColor(COLOR.dark)
        .text(topic, 60, rowY, { width: 200 })
        .text(String(score), 280, rowY, { width: 80 })
        .fillColor(score >= 70 ? COLOR.success : score >= 40 ? COLOR.warning : COLOR.danger)
        .text(String(accuracy), 380, rowY, { width: 80 });

      doc.fillColor(COLOR.dark);
      doc.moveDown(0.5);
    });
  }

  // ============================================================
  // Footer Section
  // ============================================================

  // Add footer to every page
  const pageCount = doc.bufferedPageRange();
  for (let i = 0; i < pageCount.count; i++) {
    doc.switchToPage(i);

    // Footer line
    doc
      .strokeColor(COLOR.border)
      .lineWidth(1)
      .moveTo(50, 780)
      .lineTo(545, 780)
      .stroke();

    // Footer text - page number and timestamp
    doc
      .fillColor(COLOR.muted)
      .fontSize(FONT_SIZE.caption)
      .text(
        `Generated by SmartLearn Portal | Page ${i + 1} of ${pageCount.count} | ${new Date().toLocaleString('en-IN')}`,
        50, 785,
        { width: 495, align: 'center' }
      );
  }

  // Return the document stream (caller is responsible for .pipe() and .end())
  return doc;
};

// ============================================================
// Export the PDF service function
// Used by the result controller for PDF export endpoint
// ============================================================
module.exports = {
  generateResultPDF
};
