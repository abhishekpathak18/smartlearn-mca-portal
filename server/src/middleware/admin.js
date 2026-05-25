/**
 * ============================================================
 * Admin Authorization Middleware
 * ============================================================
 * 
 * This middleware checks if the authenticated user has admin
 * privileges. It must be used AFTER the `protect` middleware
 * because it depends on `req.user` being set.
 * 
 * Role-Based Access Control (RBAC):
 * - 'student' role: Can access their own data, take tests, etc.
 * - 'admin' role: Can manage users, courses, tests, view analytics
 * 
 * Usage pattern:
 *   router.get('/admin/dashboard', protect, admin, getDashboard);
 *   (protect runs first → admin checks role → handler executes)
 * 
 * @module middleware/admin
 * ============================================================
 */

/**
 * Admin authorization middleware.
 * 
 * Checks if the authenticated user has the 'admin' role.
 * This middleware must be placed AFTER the `protect` middleware
 * in the middleware chain, as it requires `req.user` to exist.
 * 
 * Middleware Chain: protect → admin → routeHandler
 * 
 * @function admin
 * @param {import('express').Request} req - Express request object
 *   (must have req.user set by protect middleware)
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 * @returns {void} Calls next() if user is admin, sends 403 otherwise
 * 
 * @example
 * // Protecting an admin-only route
 * const { protect } = require('../middleware/auth');
 * const admin = require('../middleware/admin');
 * 
 * // Both middleware run in order: first authenticate, then authorize
 * router.get('/admin/users', protect, admin, getAllUsers);
 * router.delete('/admin/users/:id', protect, admin, deleteUser);
 * 
 * @example
 * // Applying to all routes in a router
 * const adminRouter = express.Router();
 * adminRouter.use(protect, admin); // Apply to all routes below
 * adminRouter.get('/dashboard', getDashboard);
 * adminRouter.get('/analytics', getAnalytics);
 */
const admin = (req, res, next) => {
  // ============================================================
  // Safety Check: Ensure req.user exists
  // ============================================================
  // This handles the edge case where admin middleware is
  // accidentally used without the protect middleware before it.
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in first.'
    });
  }

  // ============================================================
  // Role Authorization Check
  // ============================================================
  // Verify the user has the 'admin' role
  // req.user.role is set by the User model (default: 'student')
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required to access this resource.'
    });
  }

  // ============================================================
  // Authorization Passed - Proceed to Route Handler
  // ============================================================
  // User is authenticated AND has admin role, proceed to the
  // next middleware or the actual route handler
  next();
};

// Export the admin middleware
module.exports = { isAdmin: admin };
