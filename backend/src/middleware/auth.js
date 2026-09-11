/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AUTHENTICATION MIDDLEWARE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Validates JWT tokens and authenticates API requests
 * 
 * How It Works:
 * 1. Extracts JWT token from Authorization header (Bearer <token>)
 * 2. Verifies token signature using JWT_SECRET
 * 3. Decodes token to extract userId and role
 * 4. Attaches userId and role to request object
 * 5. Passes control to next middleware/route handler
 * 
 * Token Format:
 * - Header: Authorization: Bearer <jwt_token>
 * - Token Contents: { userId, role, iat, exp }
 * - Expiration: 30 days (set during token creation in auth routes)
 * 
 * Usage:
 * - Apply to all protected routes that require user authentication
 * - Must be called BEFORE route handler
 * - Example: app.use('/api/equipment', auth, equipmentRoutes)
 * 
 * Error Responses:
 * - 401: No token provided or invalid/expired token
 * - Token must be refreshed by re-login after expiration
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const jwt = require('jsonwebtoken');

/**
 * Authentication middleware
 * Validates JWT token and extracts user information
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * @returns {void} - Passes to next middleware on success, sends 401/403 on failure
 */
const auth = (req, res, next) => {
  // Extract token from Authorization header
  // Expected format: "Bearer <token>"
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    // Verify and decode JWT token
    // JWT_SECRET must match the secret used during token creation
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user information to request object for use in route handlers
    req.userId = decoded.userId;
    req.role = decoded.role;
    
    // Continue to next middleware/route handler
    next();
  } catch (err) {
    // Token is invalid, expired, or tampered with
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = auth;
