/**
 * ============================================================
 * Authentication Middleware - JWT Token Verification
 * ============================================================
 * 
 * This middleware protects routes that require user authentication.
 * It verifies the JWT (JSON Web Token) from the request and
 * attaches the authenticated user object to `req.user`.
 * 
 * How JWT Authentication Works:
 * 1. User logs in → Server creates a JWT with user's ID as payload
 * 2. Client stores the JWT (in localStorage, cookies, etc.)
 * 3. Client sends JWT with each request in the Authorization header
 * 4. This middleware verifies the JWT and identifies the user
 * 5. If valid, the request proceeds; if not, 401 Unauthorized is returned
 * 
 * Token can be provided in two ways:
 * - Authorization header: "Bearer <token>" (recommended for APIs)
 * - Cookie: "token=<token>" (useful for server-side rendering)
 * 
 * @module middleware/auth
 * @requires jsonwebtoken
 * @requires ../models/User
 * ============================================================
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect middleware - Verifies JWT and authenticates the user.
 * 
 * This middleware performs the following steps:
 * 1. Extracts the JWT from Authorization header or cookies
 * 2. Verifies the token's signature and expiration using JWT_SECRET
 * 3. Finds the user in the database using the decoded user ID
 * 4. Attaches the user object to req.user (excluding password)
 * 5. Calls next() to pass control to the next middleware/route handler
 * 
 * @async
 * @function protect
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 * @returns {void} Calls next() on success, sends 401 response on failure
 * 
 * @example
 * // Protecting a route
 * const { protect } = require('../middleware/auth');
 * router.get('/profile', protect, getProfile);
 * 
 * @example
 * // Accessing the authenticated user in a controller
 * const getProfile = (req, res) => {
 *   // req.user is available after protect middleware
 *   res.json({ success: true, data: req.user });
 * };
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // ============================================================
    // Step 1: Extract JWT Token from the Request
    // ============================================================
    // Check the Authorization header first (primary method)
    // Format: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6..."
    if (
      req.headers.authorization && 
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Split "Bearer <token>" and extract the token part
      token = req.headers.authorization.split(' ')[1];
    } 
    // Fallback: Check for token in cookies (alternative method)
    // This is useful for server-side rendering or when the client
    // stores the token in an HTTP-only cookie for security
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // ============================================================
    // Step 2: Check if Token Exists
    // ============================================================
    // If no token was found in either location, the user is not
    // authenticated and cannot access the protected resource
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided. Please log in.'
      });
    }

    // ============================================================
    // Step 3: Verify the JWT Token
    // ============================================================
    // jwt.verify() does three things:
    // 1. Checks the token's signature matches our JWT_SECRET
    // 2. Checks the token hasn't expired (exp claim)
    // 3. Decodes the payload and returns it
    // If any check fails, it throws an error (caught below)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ============================================================
    // Step 4: Find the User in Database
    // ============================================================
    // Use the user ID from the decoded token payload to find the user
    // .select('-password') excludes the password hash from the result
    // for security - we never want password hashes in req.user
    const user = await User.findById(decoded.id).select('-password');

    // Check if the user still exists in the database
    // They might have been deleted after the token was issued
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user associated with this token no longer exists.'
      });
    }

    // Check if the user's account is still active
    // Admins might have deactivated the account
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // ============================================================
    // Step 5: Attach User to Request Object
    // ============================================================
    // Make the user object available to all subsequent middleware
    // and route handlers via req.user
    req.user = user;

    // Proceed to the next middleware or route handler
    next();

  } catch (error) {
    // ============================================================
    // Error Handling
    // ============================================================
    // Different JWT errors require different messages

    // Token has expired (past the JWT_EXPIRE time)
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again.'
      });
    }

    // Token signature is invalid (tampered or wrong secret)
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token. Please log in again.'
      });
    }

    // Token is not yet active (nbf claim is in the future)
    if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        success: false,
        message: 'Token is not yet active. Please try again later.'
      });
    }

    // Any other unexpected error
    console.error('❌ Authentication middleware error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please log in again.'
    });
  }
};

// Export the protect middleware
module.exports = { protect };
