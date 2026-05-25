/**
 * ============================================================
 * Resend Email Service Configuration
 * ============================================================
 * 
 * This module configures the Resend email client for sending
 * transactional emails throughout the application.
 * 
 * Resend is a modern email API service used for:
 * - Email verification during user registration
 * - Password reset emails
 * - Test result notifications
 * - Course enrollment confirmations
 * - Placement-related notifications
 * 
 * Free Tier Limitations:
 * - Can only send from 'onboarding@resend.dev' sender address
 * - Limited to 100 emails/day and 3,000 emails/month
 * - To use a custom domain, upgrade and verify your domain
 * 
 * @module config/resend
 * @requires resend
 * @see https://resend.com/docs
 * ============================================================
 */

const { Resend } = require('resend');

// ============================================================
// Initialize the Resend Client
// ============================================================
// Create a new Resend instance with the API key from environment
// variables. This client will be used internally by the sendEmail
// helper function below.

const resend = new Resend(process.env.RESEND_API_KEY);

// ============================================================
// Default Sender Configuration
// ============================================================
// On Resend's free tier, we can only send from this address.
// In production with a verified custom domain, change this to
// something like 'noreply@yourdomain.com'.

const DEFAULT_FROM = 'Smart Learning Portal <onboarding@resend.dev>';

/**
 * Sends a transactional email using the Resend API.
 * 
 * This is the main email-sending function used throughout the
 * application. It handles:
 * - Sending HTML emails to specified recipients
 * - Using a default sender address (Resend free tier)
 * - Proper error handling and logging
 * - Returning the sent email data for tracking
 * 
 * @async
 * @function sendEmail
 * @param {Object} options - Email configuration options
 * @param {string|string[]} options.to - Recipient email address(es).
 *   Can be a single email string or an array of email strings.
 * @param {string} options.subject - The email subject line.
 *   Keep it concise and descriptive (under 60 chars recommended).
 * @param {string} options.html - The HTML body of the email.
 *   Supports full HTML with inline CSS for email client compatibility.
 * @returns {Promise<Object>} The response data from Resend API
 *   containing the email ID and status.
 * @throws {Error} Throws an error if the email fails to send.
 * 
 * @example
 * // Send a verification email
 * const { sendEmail } = require('./config/resend');
 * 
 * await sendEmail({
 *   to: 'student@example.com',
 *   subject: 'Verify Your Email - Smart Learning Portal',
 *   html: `
 *     <h1>Welcome to Smart Learning Portal!</h1>
 *     <p>Click the link below to verify your email:</p>
 *     <a href="${verificationLink}">Verify Email</a>
 *   `
 * });
 * 
 * @example
 * // Send a password reset email
 * await sendEmail({
 *   to: user.email,
 *   subject: 'Password Reset Request',
 *   html: `<p>Your reset token: <strong>${resetToken}</strong></p>`
 * });
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    // Send the email using Resend's emails.send() method
    // This returns a promise that resolves with the email data
    const data = await resend.emails.send({
      from: DEFAULT_FROM,   // Sender address (free tier: onboarding@resend.dev)
      to,                    // Recipient(s) - string or array of strings
      subject,               // Email subject line
      html                   // HTML body content
    });

    // Log success in development mode for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`📧 Email sent successfully to: ${to}`);
      console.log(`📋 Subject: ${subject}`);
      console.log(`🆔 Email ID: ${data.data?.id || 'N/A'}`);
    }

    // Return the response data for tracking/logging purposes
    // The data object contains: { id: 'email_id' }
    return data;

  } catch (error) {
    // Log detailed error information
    console.error('❌ Email sending failed:', error.message);
    console.error('📧 Failed recipient:', to);
    console.error('📋 Failed subject:', subject);

    // Re-throw the error so the calling function can handle it
    // (e.g., show user a message that verification email failed)
    throw new Error(`Failed to send email to ${to}: ${error.message}`);
  }
};

// ============================================================
// Export the sendEmail function and resend client
// ============================================================
// - sendEmail: Primary helper function (recommended for most use cases)
// - resend: Direct client access for advanced operations like
//   batch sending, email scheduling, or domain management

module.exports = { sendEmail, resend };
