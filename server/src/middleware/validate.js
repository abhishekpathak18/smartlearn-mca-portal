/**
 * ============================================================
 * Validation Middleware - Express-Validator Result Handler
 * ============================================================
 * 
 * This middleware processes validation results from express-validator.
 * It checks if any validation errors occurred and returns a formatted
 * error response if they did.
 * 
 * How express-validator works:
 * 1. Define validation rules in route definitions using check(), body(), etc.
 * 2. These validators run and attach results to the request
 * 3. This middleware (validate) extracts and checks those results
 * 4. If errors exist, return 400 with error details
 * 5. If no errors, call next() to proceed to the controller
 * 
 * Usage pattern in routes:
 *   router.post('/register',
 *     [
 *       body('email').isEmail().withMessage('Please enter a valid email'),
 *       body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
 *     ],
 *     validate,       // ← This middleware checks the results
 *     registerUser    // ← Controller only runs if validation passes
 *   );
 * 
 * @module middleware/validate
 * @requires express-validator
 * ============================================================
 */

const { validationResult } = require('express-validator');

/**
 * Validation result handler middleware.
 * 
 * Extracts validation errors from the request (set by express-validator
 * middleware that ran before this) and returns a structured error
 * response if any validation rules failed.
 * 
 * @function validate
 * @param {import('express').Request} req - Express request object
 *   (contains validation results from express-validator)
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 * @returns {void} Calls next() if valid, sends 400 response if errors exist
 * 
 * @example
 * // In a route file
 * const { body } = require('express-validator');
 * const validate = require('../middleware/validate');
 * 
 * router.post('/register', [
 *   body('name')
 *     .trim()
 *     .notEmpty()
 *     .withMessage('Name is required')
 *     .isLength({ min: 2, max: 50 })
 *     .withMessage('Name must be between 2 and 50 characters'),
 *   body('email')
 *     .isEmail()
 *     .withMessage('Please provide a valid email')
 *     .normalizeEmail(),
 *   body('password')
 *     .isLength({ min: 6 })
 *     .withMessage('Password must be at least 6 characters')
 * ], validate, registerController);
 * 
 * // If validation fails, the response will be:
 * // Status: 400
 * // {
 * //   success: false,
 * //   message: 'Validation failed',
 * //   errors: [
 * //     { field: 'email', message: 'Please provide a valid email' },
 * //     { field: 'password', message: 'Password must be at least 6 characters' }
 * //   ]
 * // }
 */
const validate = (req, res, next) => {
  // ============================================================
  // Extract Validation Results
  // ============================================================
  // validationResult(req) collects all validation errors from
  // the express-validator middleware chain that ran before this.
  // It returns a Result object with an isEmpty() method and
  // an array() method to get the error details.
  const errors = validationResult(req);

  // ============================================================
  // Check for Validation Errors
  // ============================================================
  // If isEmpty() returns false, there are validation errors
  if (!errors.isEmpty()) {
    // Format the errors into a clean, consistent structure
    // Each error from express-validator has:
    // - msg: The error message (from .withMessage())
    // - path: The field name that failed validation (e.g., 'email')
    // - value: The actual value that was submitted
    // - location: Where the value came from (body, params, query)
    const formattedErrors = errors.array().map((error) => ({
      field: error.path,       // The field name (e.g., 'email', 'password')
      message: error.msg,      // The error message (e.g., 'Email is required')
      value: error.value,      // The submitted value (for debugging)
      location: error.location // Where it came from (body, query, params)
    }));

    // Log validation errors in development mode for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  Validation errors:', JSON.stringify(formattedErrors, null, 2));
    }

    // Return a 400 Bad Request response with the validation errors
    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please check your input.',
      errors: formattedErrors
    });
  }

  // ============================================================
  // Validation Passed - Proceed to Controller
  // ============================================================
  // No errors found, continue to the next middleware or controller
  next();
};

// Export the validate middleware
module.exports = { validate };
