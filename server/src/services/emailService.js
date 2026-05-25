/**
 * @fileoverview Email Service - Resend Email Integration
 * 
 * This service handles all outbound email communications for the Smart Learning Portal.
 * Uses the Resend email API to send transactional emails including welcome emails,
 * password reset links, test result notifications, and general notifications.
 * 
 * Each email function generates professional HTML email templates with:
 * - Responsive design for mobile and desktop
 * - Brand-consistent styling
 * - Clear call-to-action buttons
 * - Fallback plain text
 * 
 * @module services/emailService
 * @requires resend
 */

const { Resend } = require('resend');

// ============================================================
// Initialize Resend Email Client
// Resend is a modern email API for transactional emails
// ============================================================

/** @type {Resend} Resend client instance configured with API key */
const resend = new Resend(process.env.RESEND_API_KEY);

// ============================================================
// Email Configuration Constants
// ============================================================

/**
 * Default sender email address
 * Using Resend's onboarding address for development.
 * In production, this should be replaced with a verified domain email.
 * @const {string}
 */
const FROM_EMAIL = 'SmartLearn Portal <onboarding@resend.dev>';

/**
 * Client URL for constructing links in emails
 * Used for password reset links, dashboard links, etc.
 * @const {string}
 */
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// ============================================================
// Email Template Helper
// ============================================================

/**
 * Generates a consistent HTML email wrapper template.
 * Provides a branded, responsive layout used by all email functions.
 * 
 * @param {string} title - Email title displayed in the header
 * @param {string} bodyContent - HTML content for the email body
 * @returns {string} Complete HTML email string
 */
const getEmailTemplate = (title, bodyContent) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        /* Reset styles for email clients */
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
        .header p { color: #e0d4f7; margin: 5px 0 0; font-size: 14px; }
        .body { padding: 30px; }
        .body h2 { color: #333; font-size: 20px; margin-top: 0; }
        .body p { color: #555; line-height: 1.6; font-size: 15px; }
        .btn { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 15px 0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef; }
        .footer p { color: #999; font-size: 12px; margin: 0; }
        .highlight { background-color: #f0f4ff; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea; margin: 15px 0; }
        .score-box { display: inline-block; padding: 8px 20px; background-color: #667eea; color: white; border-radius: 20px; font-size: 18px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div style="padding: 20px;">
        <div class="container">
          <div class="header">
            <h1>🎓 SmartLearn Portal</h1>
            <p>AI-Powered Learning & Placement Preparation</p>
          </div>
          <div class="body">
            ${bodyContent}
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} SmartLearn Portal. All rights reserved.</p>
            <p>This is an automated email. Please do not reply directly.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ============================================================
// Email Service Functions
// ============================================================

/**
 * Send a welcome email to a newly registered user.
 * 
 * Triggered after successful user registration. Includes a welcome message,
 * brief platform introduction, and a link to get started on the dashboard.
 * 
 * @async
 * @param {Object} user - The newly registered user object
 * @param {string} user.name - User's full name
 * @param {string} user.email - User's email address
 * @returns {Promise<Object>} Resend API response with email ID
 * @throws {Error} If email sending fails (non-blocking - logged but may not throw)
 * 
 * @example
 * await sendWelcomeEmail({ name: 'Rahul Sharma', email: 'rahul@example.com' });
 */
const sendWelcomeEmail = async (user) => {
  try {
    // Build the welcome email body with personalization
    const bodyContent = `
      <h2>Welcome aboard, ${user.name}! 🎉</h2>
      <p>Thank you for joining SmartLearn Portal - your AI-powered companion for learning and placement preparation.</p>
      
      <div class="highlight">
        <p><strong>Here's what you can do on SmartLearn:</strong></p>
        <ul style="color: #555; line-height: 2;">
          <li>📚 <strong>Enroll in Courses</strong> - Learn at your own pace</li>
          <li>📝 <strong>Take Tests</strong> - Assess your knowledge with quizzes</li>
          <li>🤖 <strong>AI Interview Prep</strong> - Practice with AI-generated questions</li>
          <li>📄 <strong>Resume Analysis</strong> - Get AI-powered resume feedback</li>
          <li>🗺️ <strong>Career Roadmap</strong> - Get a personalized preparation plan</li>
          <li>💬 <strong>AI Chat Assistant</strong> - Ask anything about learning & placements</li>
        </ul>
      </div>
      
      <p>Start your journey now and get placement-ready!</p>
      
      <div style="text-align: center;">
        <a href="${CLIENT_URL}/dashboard" class="btn">Go to Dashboard →</a>
      </div>
      
      <p style="color: #999; font-size: 13px;">
        If you didn't create this account, please ignore this email.
      </p>
    `;

    // Send the email using Resend API
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: 'Welcome to SmartLearn Portal! 🎓',
      html: getEmailTemplate('Welcome to SmartLearn', bodyContent)
    });

    console.log(`Welcome email sent to ${user.email}, ID: ${data.id}`);
    return data;
  } catch (error) {
    // Log error but don't throw - email failure shouldn't block registration
    console.error('Error sending welcome email:', error.message);
    // We don't re-throw to prevent registration from failing due to email issues
  }
};

/**
 * Send a password reset email with a secure reset link.
 * 
 * Triggered when a user requests a password reset via the forgot-password flow.
 * Contains a time-limited reset link and security instructions.
 * 
 * @async
 * @param {Object} user - The user requesting password reset
 * @param {string} user.name - User's full name
 * @param {string} user.email - User's email address
 * @param {string} resetUrl - The full URL with reset token for password reset
 * @returns {Promise<Object>} Resend API response with email ID
 * @throws {Error} If email sending fails
 * 
 * @example
 * await sendPasswordResetEmail(
 *   { name: 'Priya', email: 'priya@example.com' },
 *   'http://localhost:3000/reset-password/abc123token'
 * );
 */
const sendPasswordResetEmail = async (user, resetUrl) => {
  try {
    const bodyContent = `
      <h2>Password Reset Request 🔐</h2>
      <p>Hi ${user.name},</p>
      <p>We received a request to reset your SmartLearn Portal password. 
         Click the button below to set a new password:</p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="btn">Reset My Password →</a>
      </div>
      
      <div class="highlight">
        <p><strong>⏰ Important:</strong> This link is valid for <strong>10 minutes</strong> only. 
           After that, you'll need to request a new reset link.</p>
      </div>
      
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #667eea; font-size: 13px;">${resetUrl}</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      
      <p style="color: #999; font-size: 13px;">
        <strong>Didn't request this?</strong> If you didn't request a password reset, 
        you can safely ignore this email. Your password will remain unchanged.
        If you suspect unauthorized access, please contact support immediately.
      </p>
    `;

    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: 'Reset Your SmartLearn Password 🔐',
      html: getEmailTemplate('Password Reset', bodyContent)
    });

    console.log(`Password reset email sent to ${user.email}, ID: ${data.id}`);
    return data;
  } catch (error) {
    console.error('Error sending password reset email:', error.message);
    throw new Error('Failed to send password reset email. Please try again later.');
  }
};

/**
 * Send a test result notification email with score summary.
 * 
 * Triggered after a user submits a test. Includes the score, pass/fail status,
 * and a link to view the detailed results on the platform.
 * 
 * @async
 * @param {Object} user - The user who took the test
 * @param {string} user.name - User's full name
 * @param {string} user.email - User's email address
 * @param {Object} result - The test result data
 * @param {string} result._id - Result document ID
 * @param {string} result.testTitle - Name/title of the test
 * @param {number} result.score - Score achieved (percentage 0-100)
 * @param {number} result.totalQuestions - Total number of questions
 * @param {number} result.correctAnswers - Number of correct answers
 * @param {boolean} result.passed - Whether the user passed the test
 * @param {string} result.completedAt - When the test was completed
 * @returns {Promise<Object>} Resend API response with email ID
 * @throws {Error} If email sending fails (non-blocking)
 * 
 * @example
 * await sendTestResultEmail(user, {
 *   testTitle: 'JavaScript Basics',
 *   score: 85,
 *   totalQuestions: 20,
 *   correctAnswers: 17,
 *   passed: true
 * });
 */
const sendTestResultEmail = async (user, result) => {
  try {
    // Determine pass/fail styling
    const statusColor = result.passed ? '#28a745' : '#dc3545';
    const statusText = result.passed ? 'PASSED ✅' : 'NEEDS IMPROVEMENT 📚';
    const statusEmoji = result.passed ? '🎉' : '💪';

    const bodyContent = `
      <h2>Test Results Are In! ${statusEmoji}</h2>
      <p>Hi ${user.name},</p>
      <p>Your results for <strong>"${result.testTitle || 'Test'}"</strong> are now available.</p>
      
      <div style="text-align: center; margin: 25px 0;">
        <div class="score-box">${result.score}%</div>
        <p style="color: ${statusColor}; font-weight: bold; font-size: 16px; margin-top: 10px;">
          ${statusText}
        </p>
      </div>
      
      <div class="highlight">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #555;">📋 Total Questions</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #333;">${result.totalQuestions}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #555;">✅ Correct Answers</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #28a745;">${result.correctAnswers}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #555;">❌ Incorrect Answers</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #dc3545;">${result.totalQuestions - result.correctAnswers}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #555;">🕐 Completed</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #333;">${new Date(result.completedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</td>
          </tr>
        </table>
      </div>
      
      <p>${result.passed 
        ? 'Great job! Keep up the excellent work and continue building your skills.' 
        : 'Don\'t worry! Review the answers, study the topics, and try again. Every attempt makes you stronger.'
      }</p>
      
      <div style="text-align: center;">
        <a href="${CLIENT_URL}/results/${result._id}" class="btn">View Detailed Results →</a>
      </div>
    `;

    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: `Test Result: ${result.testTitle || 'Quiz'} - ${result.score}% ${result.passed ? '✅' : '📚'}`,
      html: getEmailTemplate('Test Results', bodyContent)
    });

    console.log(`Test result email sent to ${user.email}, ID: ${data.id}`);
    return data;
  } catch (error) {
    // Log but don't throw - email failure shouldn't affect the test submission flow
    console.error('Error sending test result email:', error.message);
  }
};

/**
 * Send a general notification email to a user.
 * 
 * Used for various platform notifications like course updates,
 * achievement notifications, reminders, and system announcements.
 * 
 * @async
 * @param {Object} user - The recipient user
 * @param {string} user.name - User's full name
 * @param {string} user.email - User's email address
 * @param {Object} notification - The notification data
 * @param {string} notification.title - Notification title/subject
 * @param {string} notification.message - Notification message body
 * @param {string} [notification.type='info'] - Notification type (info/success/warning)
 * @param {string} [notification.actionUrl] - Optional URL for the action button
 * @param {string} [notification.actionText] - Optional text for the action button
 * @returns {Promise<Object>} Resend API response with email ID
 * @throws {Error} If email sending fails (non-blocking)
 * 
 * @example
 * await sendNotificationEmail(user, {
 *   title: 'New Course Available!',
 *   message: 'A new course on "Advanced React Patterns" has been added.',
 *   type: 'info',
 *   actionUrl: '/courses/new-course-id',
 *   actionText: 'View Course'
 * });
 */
const sendNotificationEmail = async (user, notification) => {
  try {
    // Map notification type to emoji for visual distinction
    const typeEmoji = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      achievement: '🏆',
      reminder: '⏰'
    };

    const emoji = typeEmoji[notification.type] || 'ℹ️';

    const bodyContent = `
      <h2>${emoji} ${notification.title}</h2>
      <p>Hi ${user.name},</p>
      
      <div class="highlight">
        <p>${notification.message}</p>
      </div>
      
      ${notification.actionUrl ? `
        <div style="text-align: center;">
          <a href="${CLIENT_URL}${notification.actionUrl}" class="btn">
            ${notification.actionText || 'View Details'} →
          </a>
        </div>
      ` : ''}
      
      <p style="color: #999; font-size: 13px; margin-top: 20px;">
        You're receiving this because you have notifications enabled on SmartLearn Portal.
        <a href="${CLIENT_URL}/settings" style="color: #667eea;">Manage preferences</a>
      </p>
    `;

    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: `${emoji} ${notification.title} - SmartLearn`,
      html: getEmailTemplate('Notification', bodyContent)
    });

    console.log(`Notification email sent to ${user.email}, ID: ${data.id}`);
    return data;
  } catch (error) {
    // Log but don't throw - notification email is non-critical
    console.error('Error sending notification email:', error.message);
  }
};

// ============================================================
// Export all email service functions
// These are used by various controllers throughout the app
// ============================================================
module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendTestResultEmail,
  sendNotificationEmail
};
