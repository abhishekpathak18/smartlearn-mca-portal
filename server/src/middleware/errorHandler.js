/**
 * ============================================================
 * Global Error Handler Middleware
 * ============================================================
 * 
 * This is the centralized error handling middleware for the entire
 * Express application. It catches all errors thrown or passed via
 * next(error) from any route handler or middleware.
 * 
 * Express recognizes this as an error-handling middleware because
 * it has FOUR parameters: (err, req, res, next) — this signature
 * is what differentiates it from regular middleware.
 * 
 * This error handler manages:
 * - Mongoose CastError (invalid MongoDB ObjectId)
 * - Mongoose ValidationError (schema validation failures)
 * - MongoDB 11000 error (duplicate key violations)
 * - JWT errors (handled in auth middleware, but caught here as fallback)
 * - Generic server errors (500 Internal Server Error)
 * 
 * @module middleware/errorHandler
 * ============================================================
 */

/**
 * Global error handling middleware.
 * 
 * This middleware is registered LAST in the middleware chain
 * (after all routes) using: app.use(errorHandler);
 * 
 * Any error thrown in a route handler or passed via next(error)
 * will be caught and processed here, ensuring the client always
 * receives a properly formatted JSON error response.
 * 
 * @function errorHandler
 * @param {Error} err - The error object thrown or passed via next()
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 *   (required for Express to recognize this as error middleware)
 * @returns {void} Sends a JSON error response to the client
 * 
 * @example
 * // In a controller - throwing an error
 * const getUser = async (req, res, next) => {
 *   try {
 *     const user = await User.findById(req.params.id);
 *     if (!user) {
 *       const error = new Error('User not found');
 *       error.statusCode = 404;
 *       throw error;
 *     }
 *     res.json({ success: true, data: user });
 *   } catch (error) {
 *     next(error); // Passes to this error handler
 *   }
 * };
 * 
 * // In app.js - registering the error handler
 * const errorHandler = require('./middleware/errorHandler');
 * app.use(errorHandler); // Must be LAST middleware
 */
const errorHandler = (err, req, res, next) => {
  // ============================================================
  // Create a mutable copy of error properties
  // ============================================================
  // We copy the error properties so we can modify them without
  // affecting the original error object.
  let error = { ...err };
  error.message = err.message;

  // Default status code and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // ============================================================
  // Development Logging
  // ============================================================
  // In development mode, log the full error stack trace for debugging.
  // In production, we only send the error message to the client
  // to avoid exposing internal implementation details.
  if (process.env.NODE_ENV === 'development') {
    console.error('═══════════════════════════════════════════');
    console.error('❌ ERROR DETAILS:');
    console.error('═══════════════════════════════════════════');
    console.error(`📍 URL: ${req.method} ${req.originalUrl}`);
    console.error(`📝 Message: ${err.message}`);
    console.error(`🏷️  Name: ${err.name}`);
    if (err.code) console.error(`🔢 Code: ${err.code}`);
    console.error('📚 Stack:', err.stack);
    console.error('═══════════════════════════════════════════');
  }

  // ============================================================
  // Handle Specific Error Types
  // ============================================================

  /**
   * 1. Mongoose CastError - Invalid ObjectId
   * ============================================================
   * This occurs when a request includes an invalid MongoDB ObjectId
   * in a URL parameter. For example:
   * - GET /api/users/invalid-id  → CastError
   * - GET /api/users/12345       → CastError (not a valid 24-char hex)
   * - GET /api/users/507f1f77bcf86cd799439011 → Valid ObjectId
   * 
   * MongoDB ObjectIds are 24-character hexadecimal strings.
   */
  if (err.name === 'CastError') {
    message = `Resource not found. Invalid ID: ${err.value}`;
    statusCode = 400;
  }

  /**
   * 2. MongoDB Duplicate Key Error (Code 11000)
   * ============================================================
   * This occurs when trying to insert a document with a value
   * that already exists in a unique-indexed field. For example:
   * - Registering with an email that's already in use
   * - Creating a course with a duplicate slug
   * 
   * err.keyValue contains the field(s) that caused the conflict.
   * Example: { email: 'test@example.com' }
   */
  if (err.code === 11000) {
    // Extract the duplicate field name from the error
    const duplicateField = Object.keys(err.keyValue || {}).join(', ');
    message = `Duplicate value entered for ${duplicateField}. This ${duplicateField} is already in use.`;
    statusCode = 400;
  }

  /**
   * 3. Mongoose ValidationError
   * ============================================================
   * This occurs when a document fails Mongoose schema validation.
   * For example:
   * - Missing a required field
   * - Value doesn't match enum options
   * - Value exceeds minlength/maxlength
   * 
   * err.errors is an object with a key for each failed field,
   * and each value has a 'message' property with the error message.
   */
  if (err.name === 'ValidationError') {
    // Extract all validation error messages into an array
    const validationErrors = Object.values(err.errors).map(
      (val) => val.message
    );
    message = `Validation Error: ${validationErrors.join('. ')}`;
    statusCode = 400;
  }

  /**
   * 4. JWT Errors (Fallback)
   * ============================================================
   * These are primarily handled in the auth middleware, but we
   * catch them here as a safety net in case they bubble up.
   */
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token. Please log in again.';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Token expired. Please log in again.';
    statusCode = 401;
  }

  /**
   * 5. Multer File Upload Errors
   * ============================================================
   * These occur during file upload operations (e.g., resume upload).
   * Common errors include file too large, wrong file type, etc.
   */
  if (err.code === 'LIMIT_FILE_SIZE') {
    message = 'File size too large. Maximum allowed size is 5MB.';
    statusCode = 400;
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    message = 'Unexpected file field. Please check the upload field name.';
    statusCode = 400;
  }

  /**
   * 6. Syntax Error (Invalid JSON)
   * ============================================================
   * This occurs when the request body contains malformed JSON.
   * Express's json() middleware throws this when it can't parse
   * the request body.
   */
  if (err.type === 'entity.parse.failed') {
    message = 'Invalid JSON in request body. Please check your request format.';
    statusCode = 400;
  }

  // ============================================================
  // Send Error Response
  // ============================================================
  // Always return a consistent JSON structure for error responses.
  // In development, include the stack trace for debugging.
  // In production, only send the error message.
  res.status(statusCode).json({
    success: false,
    message,
    // Include error stack trace only in development mode
    // This helps with debugging but should never be exposed in production
    ...(process.env.NODE_ENV === 'development' && {
      error: err.name,
      stack: err.stack
    })
  });
};

// Export the error handler middleware
module.exports = errorHandler;
