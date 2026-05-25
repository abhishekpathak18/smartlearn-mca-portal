/**
 * ============================================================================
 * User Model - Smart Learning & Placement Preparation Portal
 * ============================================================================
 *
 * This model represents all users of the portal (students and admins).
 * It handles:
 *   - User registration and profile storage
 *   - Password hashing with bcryptjs (pre-save hook)
 *   - JWT token generation for authentication
 *   - Password comparison for login verification
 *   - Password reset token management
 *
 * @module models/User
 * @requires mongoose
 * @requires bcryptjs
 * @requires jsonwebtoken
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * @typedef {Object} UserSchema
 * @property {String} name - Full name of the user (required)
 * @property {String} email - Unique email address used for login (required, lowercase, indexed)
 * @property {String} password - Hashed password, excluded from queries by default (min 6 chars)
 * @property {String} role - User role: 'student' or 'admin' (default: 'student')
 * @property {String} avatar - URL or path to user's profile picture
 * @property {String} phone - Contact phone number
 * @property {String} university - University name (default: 'Chandigarh University')
 * @property {String} department - Department/course name (default: 'MCA')
 * @property {Number} semester - Current semester number
 * @property {Array<String>} skills - List of skills the user possesses
 * @property {String} bio - Short biography or description
 * @property {String} resetPasswordToken - Token for password reset functionality
 * @property {Date} resetPasswordExpire - Expiry time for the reset password token
 * @property {Date} lastLogin - Timestamp of the user's most recent login
 * @property {Boolean} isActive - Whether the user account is active (default: true)
 */
const userSchema = new mongoose.Schema(
  {
    // ── Core Identity Fields ──────────────────────────────────────────

    /**
     * Full name of the user.
     * Required for registration; used throughout the portal for display.
     */
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,       // Remove leading/trailing whitespace
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },

    /**
     * Email address — serves as the unique identifier for login.
     * Stored in lowercase to avoid duplicate entries due to casing.
     * Indexed for fast lookup during authentication.
     */
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,   // Automatically convert to lowercase before saving
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },

    /**
     * User's password — stored as a bcrypt hash, NEVER in plain text.
     * `select: false` ensures the password is excluded from query results
     * unless explicitly requested with `.select('+password')`.
     * Minimum length of 6 characters enforced at schema level.
     */
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Do not return password in queries by default
    },

    // ── Role & Access Control ─────────────────────────────────────────

    /**
     * User role determines access permissions across the portal.
     * - 'student': Can take tests, view courses, generate resumes, etc.
     * - 'admin': Can create courses, tests, view analytics, manage users.
     */
    role: {
      type: String,
      enum: {
        values: ['student', 'admin'],
        message: 'Role must be either student or admin',
      },
      default: 'student',
    },

    // ── Profile Information ───────────────────────────────────────────

    /**
     * URL or file path to the user's avatar/profile picture.
     * Can be updated via the profile settings.
     */
    avatar: {
      type: String,
      default: null,
    },

    /**
     * Contact phone number for the user.
     * Optional field, useful for placement-related contact.
     */
    phone: {
      type: String,
      trim: true,
    },

    /**
     * University the student belongs to.
     * Defaults to 'Chandigarh University' as this portal is designed
     * primarily for CU students.
     */
    university: {
      type: String,
      default: 'Chandigarh University',
      trim: true,
    },

    /**
     * Academic department or program the student is enrolled in.
     * Defaults to 'MCA' (Master of Computer Applications).
     */
    department: {
      type: String,
      default: 'MCA',
      trim: true,
    },

    /**
     * Current semester of the student (1–6 for MCA).
     * Helps in providing semester-specific content recommendations.
     */
    semester: {
      type: Number,
      min: [1, 'Semester must be at least 1'],
      max: [10, 'Semester cannot exceed 10'],
    },

    /**
     * Array of skills the user has listed on their profile.
     * Used for personalized course recommendations and resume analysis.
     * Example: ['JavaScript', 'React', 'Node.js', 'MongoDB']
     */
    skills: {
      type: [String],
      default: [],
    },

    /**
     * Short biography or "about me" section for the user's profile.
     * Displayed on the user's public profile page.
     */
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },

    // ── Password Reset Fields ─────────────────────────────────────────

    /**
     * Hashed token generated when a user requests a password reset.
     * Compared against the token in the reset URL to verify the request.
     */
    resetPasswordToken: {
      type: String,
    },

    /**
     * Expiry timestamp for the password reset token.
     * Once expired, the user must request a new reset link.
     */
    resetPasswordExpire: {
      type: Date,
    },

    // ── Account Metadata ──────────────────────────────────────────────

    /**
     * Timestamp of the user's last successful login.
     * Tracked for security and analytics purposes.
     */
    lastLogin: {
      type: Date,
    },

    /**
     * Soft-delete flag: if false, the account is deactivated.
     * Deactivated accounts cannot log in but data is preserved.
     */
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    /**
     * `timestamps: true` automatically adds:
     *   - createdAt: Date when the document was first created
     *   - updatedAt: Date when the document was last modified
     * These are managed entirely by Mongoose.
     */
    timestamps: true,
  }
);

// ── Indexes ─────────────────────────────────────────────────────────────
/**
 * Create an index on the email field for faster lookups during login.
 * The `unique: true` on the field already creates a unique index,
 * but we explicitly define it here for clarity and documentation.
 */
userSchema.index({ email: 1 });

// ── Pre-Save Middleware (Password Hashing) ──────────────────────────────
/**
 * Before saving a user document, hash the password if it has been modified.
 * This ensures:
 *   1. New users get their password hashed on registration
 *   2. Password changes are hashed before updating
 *   3. Other profile updates don't re-hash the already-hashed password
 *
 * bcryptjs with salt rounds = 12 provides a good balance between
 * security and performance.
 */
userSchema.pre('save', async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return;
  }

  // Generate a salt with 10 rounds (higher = more secure but slower)
  const salt = await bcrypt.genSalt(10);

  // Hash the plain-text password with the generated salt
  this.password = await bcrypt.hash(this.password, salt);
});

// ── Instance Methods ────────────────────────────────────────────────────

/**
 * Compare a candidate (plain-text) password with the stored hashed password.
 * Used during the login process to verify user credentials.
 *
 * @param {String} candidatePassword - The plain-text password entered by the user
 * @returns {Promise<Boolean>} - True if the passwords match, false otherwise
 *
 * @example
 *   const user = await User.findOne({ email }).select('+password');
 *   const isMatch = await user.matchPassword(enteredPassword);
 */
userSchema.methods.matchPassword = async function (candidatePassword) {
  // bcrypt.compare hashes the candidate and compares with stored hash
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Generate a signed JSON Web Token (JWT) for the user.
 * The token contains the user's ID as the payload and is signed
 * with the JWT_SECRET from environment variables.
 *
 * @returns {String} - Signed JWT token string
 *
 * @example
 *   const token = user.getSignedJwtToken();
 *   // Send token to client for subsequent authenticated requests
 */
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id },                    // Payload: user's MongoDB ObjectId
    process.env.JWT_SECRET,              // Secret key from environment
    { expiresIn: process.env.JWT_EXPIRE } // Token expiry (e.g., '7d')
  );
};

// ── Create and Export the Model ─────────────────────────────────────────
/**
 * Create the User model from the schema.
 * MongoDB will create a 'users' collection (lowercase, pluralized).
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
