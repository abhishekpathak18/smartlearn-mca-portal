/**
 * ============================================================================
 * AUTH CONTROLLER - Smart Learning & Placement Preparation Portal
 * ============================================================================
 * 
 * This controller handles all authentication-related operations:
 * - User registration (sign up)
 * - User login (sign in) with JWT token generation
 * - Password reset flow (forgot + reset)
 * - Get current logged-in user profile
 * - User logout (clear auth cookie)
 * 
 * Security features:
 * - Passwords are hashed using bcryptjs before storage
 * - JWT tokens are stored in httpOnly cookies (prevents XSS)
 * - Password reset uses crypto tokens with expiration
 * - Login activity is logged for security auditing
 * 
 * @module controllers/authController
 * @requires mongoose models: User
 * @requires jsonwebtoken for JWT generation
 * @requires bcryptjs for password comparison
 * @requires crypto for reset token generation
 * ============================================================================
 */

// ─── Module Imports ─────────────────────────────────────────────────────────────
const User = require('../models/User');               // User Mongoose model
const jwt = require('jsonwebtoken');                   // JWT token creation/verification
const bcrypt = require('bcryptjs');                    // Password hashing & comparison
const crypto = require('crypto');                      // Built-in Node.js crypto for reset tokens

// ─── Helper: Generate JWT Token ─────────────────────────────────────────────────
/**
 * Generates a signed JWT token for a given user ID.
 * The token is signed with the JWT_SECRET from environment variables
 * and expires based on JWT_EXPIRE setting (default: 7 days).
 * 
 * @param {string} userId - The MongoDB ObjectId of the user
 * @returns {string} Signed JWT token string
 * @example
 * const token = generateToken('60d5ec49f1b2c72b7c8e4567');
 * // Returns: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },                          // Payload: user's MongoDB _id
    process.env.JWT_SECRET,                  // Secret key from environment
    { expiresIn: process.env.JWT_EXPIRE || '7d' }  // Token expiration (default 7 days)
  );
};

// ─── Helper: Send Token Response ────────────────────────────────────────────────
/**
 * Creates a JWT token and sends it back to the client in both:
 * 1. An httpOnly cookie (for browser security - prevents XSS attacks)
 * 2. The JSON response body (for mobile apps / API consumers)
 * 
 * Cookie settings:
 * - httpOnly: true → JavaScript cannot access the cookie (XSS protection)
 * - secure: true in production → Cookie only sent over HTTPS
 * - sameSite: 'strict' → Cookie not sent in cross-origin requests (CSRF protection)
 * - maxAge: 7 days → Cookie expires after 7 days
 * 
 * @param {Object} user - The Mongoose user document
 * @param {number} statusCode - HTTP status code to send (200, 201, etc.)
 * @param {Object} res - Express response object
 */
const sendTokenResponse = (user, statusCode, res) => {
  // Generate JWT token for this user
  const token = generateToken(user._id);

  // Configure cookie options for security
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    httpOnly: true,       // Cookie cannot be accessed by client-side JavaScript
    sameSite: 'strict',   // Cookie not sent with cross-site requests
    secure: process.env.NODE_ENV === 'production' // HTTPS only in production
  };

  // Remove password from the user object before sending in response
  // We use toObject() to convert Mongoose document to plain JS object
  const userResponse = user.toObject();
  delete userResponse.password;

  // Send response with cookie + JSON body
  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)    // Set httpOnly cookie
    .json({
      success: true,
      message: statusCode === 201 ? 'Registration successful' : 'Login successful',
      data: {
        user: userResponse,
        token  // Also include token in body for API consumers
      }
    });
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Register a new user account
 * @route   POST /api/auth/register
 * @access  Public (no authentication required)
 * 
 * Flow:
 * 1. Extract user details from request body
 * 2. Check if email is already registered (prevent duplicates)
 * 3. Create new user document in MongoDB (password auto-hashed by model)
 * 4. Generate JWT token and send response
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing user data
 * @param {string} req.body.name - User's full name
 * @param {string} req.body.email - User's email address (must be unique)
 * @param {string} req.body.password - User's password (min 6 characters)
 * @param {string} [req.body.role] - User's role (default: 'student')
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with user data and JWT token
 */
const register = async (req, res) => {
  try {
    // Step 1: Destructure required fields from request body
    const { name, email, password, role } = req.body;

    // Step 2: Validate that all required fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and password'
      });
    }

    // Step 3: Check if a user with this email already exists in the database
    // This prevents duplicate registrations with the same email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email already exists'
      });
    }

    // Step 4: Create a new user document in MongoDB
    // Note: Password hashing is handled by the User model's pre-save middleware
    const user = await User.create({
      name,
      email: email.toLowerCase(),   // Store email in lowercase for consistency
      password,                      // Will be hashed by the pre-save hook
      role: role || 'student'        // Default role is 'student'
    });

    // Step 5: Log the registration activity for audit trail
    console.log(`[AUTH] New user registered: ${user.email} (ID: ${user._id})`);

    // Step 6: Generate JWT token and send response with 201 (Created) status
    sendTokenResponse(user, 201, res);

  } catch (error) {
    // Handle Mongoose validation errors (e.g., invalid email format)
    console.error('[AUTH] Registration error:', error.message);

    // Check for MongoDB duplicate key error (code 11000)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email already exists'
      });
    }

    // Check for Mongoose validation errors
    if (error.name === 'ValidationError') {
      // Extract all validation error messages into an array
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      error: 'Server error during registration. Please try again.'
    });
  }
};

/**
 * @desc    Login user with email and password
 * @route   POST /api/auth/login
 * @access  Public
 * 
 * Flow:
 * 1. Validate email and password are provided
 * 2. Find user by email (include password field which is normally excluded)
 * 3. Compare provided password with hashed password using bcrypt
 * 4. Update lastLogin timestamp for tracking
 * 5. Log the login activity
 * 6. Generate JWT token and send response
 * 
 * @param {Object} req - Express request object
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.password - User's password
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with user data and JWT token
 */
const login = async (req, res) => {
  try {
    // Step 1: Extract credentials from request body
    const { email, password } = req.body;

    // Step 2: Validate that both email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }

    // Step 3: Find user by email
    // We use .select('+password') because password field has select: false in the schema,
    // which means it's excluded from queries by default for security
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    // Step 4: Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'  // Generic message to prevent email enumeration
      });
    }

    // Step 5: Check if user account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Step 6: Compare the provided password with the stored hashed password
    // bcrypt.compare handles the salt extraction and comparison internally
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'  // Same generic message (security best practice)
      });
    }

    // Step 7: Update the lastLogin timestamp
    // This helps track user activity and identify inactive accounts
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false }); // Skip validation since we only update lastLogin

    // Step 8: Log the successful login activity
    console.log(`[AUTH] User logged in: ${user.email} at ${new Date().toISOString()}`);

    // Step 9: Generate JWT token and send response
    sendTokenResponse(user, 200, res);

  } catch (error) {
    console.error('[AUTH] Login error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error during login. Please try again.'
    });
  }
};

/**
 * @desc    Initiate password reset - sends reset email with token
 * @route   POST /api/auth/forgot-password
 * @access  Public
 * 
 * Flow:
 * 1. Find user by email
 * 2. Generate a random crypto token (32 bytes hex)
 * 3. Hash the token and save to user document with expiry (10 minutes)
 * 4. Send reset email with the un-hashed token link
 * 5. Respond with success message
 * 
 * Security: We store the HASHED token in DB but send the PLAIN token in email.
 * When user clicks the link, we hash what they provide and compare with DB.
 * This way, even if DB is compromised, the token can't be used.
 * 
 * @param {Object} req - Express request object
 * @param {string} req.body.email - Email address of the account to reset
 * @param {Object} res - Express response object
 * @returns {Object} JSON response confirming email was sent
 */
const forgotPassword = async (req, res) => {
  try {
    // Step 1: Extract email from request body
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an email address'
      });
    }

    // Step 2: Find the user by their email address
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // SECURITY: We respond with success even if user doesn't exist
      // This prevents email enumeration attacks (attacker can't tell
      // which emails are registered by observing different responses)
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    }

    // Step 3: Generate a cryptographically secure random token
    // crypto.randomBytes(32) generates 32 random bytes
    // .toString('hex') converts to a 64-character hexadecimal string
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Step 4: Hash the token before storing in database
    // We store the hash, not the plain token, for security
    // If the database is ever compromised, attackers can't use the hashed tokens
    user.resetPasswordToken = crypto
      .createHash('sha256')           // Use SHA-256 hashing algorithm
      .update(resetToken)             // Hash the plain token
      .digest('hex');                 // Output as hexadecimal string

    // Step 5: Set token expiry to 10 minutes from now
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes in milliseconds

    // Step 6: Save user with the reset token (skip validation since we only update specific fields)
    await user.save({ validateBeforeSave: false });

    // Step 7: Build the password reset URL that will be sent in the email
    // The CLIENT_URL points to the frontend application
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Step 8: Try to send the reset email
    // In a production app, this would use the emailService/resend
    try {
      // Import and use email service if available
      // For now, we log the reset URL (in production, this would be sent via Resend)
      console.log(`[AUTH] Password reset URL for ${user.email}: ${resetUrl}`);

      // TODO: Uncomment when email service is implemented
      // const emailService = require('../services/emailService');
      // await emailService.sendPasswordResetEmail(user.email, user.name, resetUrl);

      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent',
        // Include resetUrl in development mode for testing
        ...(process.env.NODE_ENV === 'development' && { resetUrl })
      });

    } catch (emailError) {
      // If email sending fails, clean up the token from the database
      // so the user can request another reset
      console.error('[AUTH] Email sending failed:', emailError.message);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        error: 'Failed to send reset email. Please try again later.'
      });
    }

  } catch (error) {
    console.error('[AUTH] Forgot password error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error. Please try again.'
    });
  }
};

/**
 * @desc    Reset password using the token received via email
 * @route   PUT /api/auth/reset-password/:resetToken
 * @access  Public (but requires valid reset token)
 * 
 * Flow:
 * 1. Hash the token from URL params (to match what's stored in DB)
 * 2. Find user with matching hashed token AND token not expired
 * 3. Set the new password (will be hashed by pre-save middleware)
 * 4. Clear the reset token fields from user document
 * 5. Respond with success
 * 
 * @param {Object} req - Express request object
 * @param {string} req.params.resetToken - The plain reset token from the email link
 * @param {string} req.body.password - The new password to set
 * @param {Object} res - Express response object
 * @returns {Object} JSON response confirming password was reset
 */
const resetPassword = async (req, res) => {
  try {
    // Step 1: Get the new password from request body
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a new password'
      });
    }

    // Step 2: Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    // Step 3: Hash the token from URL params to match with stored hash
    // The token in the URL is the plain token; we hash it to compare with DB
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    // Step 4: Find user with matching hashed token AND token hasn't expired
    // $gt: Date.now() ensures the expiry time is still in the future
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }  // Token must not be expired
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token. Please request a new password reset.'
      });
    }

    // Step 5: Set the new password
    // The User model's pre-save middleware will automatically hash this password
    user.password = password;

    // Step 6: Clear the reset token fields so the token can't be reused
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    // Step 7: Save the user (triggers pre-save middleware for password hashing)
    await user.save();

    // Step 8: Log the password reset for auditing
    console.log(`[AUTH] Password reset successful for: ${user.email}`);

    // Step 9: Respond with success
    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('[AUTH] Reset password error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error during password reset. Please try again.'
    });
  }
};

/**
 * @desc    Get the currently logged-in user's profile
 * @route   GET /api/auth/me
 * @access  Private (requires authentication)
 * 
 * This endpoint returns the user object that was attached to req.user
 * by the authentication middleware. The middleware verifies the JWT token
 * and fetches the user from the database.
 * 
 * @param {Object} req - Express request object (req.user set by auth middleware)
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with the current user's profile data
 */
const getMe = async (req, res) => {
  try {
    // req.user is populated by the 'protect' authentication middleware
    // It contains the full user document (without password)
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('[AUTH] Get me error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching profile'
    });
  }
};

/**
 * @desc    Logout the current user by clearing the auth cookie
 * @route   POST /api/auth/logout
 * @access  Private (requires authentication)
 * 
 * Since we use httpOnly cookies for authentication, the client can't
 * delete the cookie directly via JavaScript. This endpoint clears the
 * cookie on the server side by setting it to 'none' with an immediate
 * expiration.
 * 
 * For API consumers using the Authorization header, they simply need to
 * discard their stored token on the client side.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response confirming logout
 */
const logout = async (req, res) => {
  try {
    // Clear the 'token' cookie by setting it to 'none' and expiring it immediately
    // The browser will delete the cookie when it receives this response
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 5 * 1000), // Expires in 5 seconds
      httpOnly: true,        // Keep httpOnly for consistency
      sameSite: 'strict'     // Keep sameSite for consistency
    });

    console.log(`[AUTH] User logged out: ${req.user ? req.user.email : 'unknown'}`);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('[AUTH] Logout error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error during logout'
    });
  }
};

// ─── Export All Controller Functions ────────────────────────────────────────────
// These functions will be imported by the auth routes file
module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  logout
};
