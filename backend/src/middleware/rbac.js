/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ROLE-BASED ACCESS CONTROL (RBAC) MIDDLEWARE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Implements role-based authorization for API endpoints
 * 
 * Four User Roles:
 * 1. admin     - Full system access, user management, all operations
 * 2. manager   - Equipment/work management, analytics, approvals (no user management)
 * 3. technician - Can log work, view equipment, create records
 * 4. viewer    - Read-only access to reports and analytics
 * 
 * Permissions Structure:
 * - Each role has 9 permissions (boolean flags)
 * - Permissions control different API operations
 * - Middleware checks permissions before executing handlers
 * 
 * Usage Examples:
 * 
 * 1. Check if user has specific role:
 *    router.post('/admin-only', checkRole('admin'), handler)
 *    router.post('/managers', checkRole(['admin', 'manager']), handler)
 * 
 * 2. Check if user has specific permission:
 *    router.post('/edit-equipment', checkPermission('canEditAll'), handler)
 * 
 * 3. Check ownership or admin:
 *    router.put('/profile/:userId', checkOwnershipOrAdmin, handler)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * PERMISSIONS MATRIX
 * Defines which permissions each role has
 * 
 * Permissions:
 * - canViewAll: Can view all equipment/work records
 * - canEditAll: Can edit all records
 * - canDeleteAll: Can delete any record
 * - canApproveWork: Can approve/reject work records
 * - canManageUsers: Can create/edit/delete user accounts
 * - canViewAnalytics: Can access analytics and reports
 * - canCreateTemplates: Can create inspection checklists
 * - canAssignWork: Can assign work to other technicians
 * - canGenerateReports: Can generate PDF/Excel reports
 */
const PERMISSIONS = {
  // Admin: Full access to all features
  admin: {
    canViewAll: true,         // See all data
    canEditAll: true,         // Modify any record
    canDeleteAll: true,       // Delete any record
    canApproveWork: true,     // Approve work requests
    canManageUsers: true,     // Create/edit/delete users
    canViewAnalytics: true,   // View statistics and analytics
    canCreateTemplates: true, // Create inspection templates
    canAssignWork: true,      // Assign tasks to team members
    canGenerateReports: true, // Export reports
  },
  
  // Manager: Can manage operations, view analytics, but NOT manage users
  manager: {
    canViewAll: true,
    canEditAll: true,
    canDeleteAll: true,
    canApproveWork: true,
    canManageUsers: false,    // Cannot manage user accounts
    canViewAnalytics: true,
    canCreateTemplates: true,
    canAssignWork: true,
    canGenerateReports: true,
  },
  
  // Technician: Limited permissions, mainly for logging work
  technician: {
    canViewAll: false,        // Can only view own records
    canEditAll: false,        // Can only edit own records
    canDeleteAll: false,
    canApproveWork: false,
    canManageUsers: false,
    canViewAnalytics: false,  // Cannot view company analytics
    canCreateTemplates: false,
    canAssignWork: false,
    canGenerateReports: false,
  },
  
  // Viewer: Read-only access to reports and analytics
  viewer: {
    canViewAll: true,         // Can view all data (read-only)
    canEditAll: false,        // Cannot edit anything
    canDeleteAll: false,
    canApproveWork: false,
    canManageUsers: false,
    canViewAnalytics: true,   // Can view reports
    canCreateTemplates: false,
    canAssignWork: false,
    canGenerateReports: true, // Can generate/export reports
  },
};

/**
 * ROLE CHECKING MIDDLEWARE
 * 
 * Validates that user's role matches required roles for endpoint
 * 
 * @param {string|string[]} requiredRoles - Single role or array of allowed roles
 * @returns {Function} - Express middleware function
 * 
 * Example:
 * router.delete('/user/:id', checkRole('admin'), deleteUser)
 * router.post('/work', checkRole(['admin', 'manager']), createWork)
 */
const checkRole = (requiredRoles) => {
  return (req, res, next) => {
    // Verify role is attached to request (done by auth middleware)
    if (!req.role) {
      return res.status(401).json({ error: 'User role not found' });
    }

    // Convert single role to array for consistency
    if (!Array.isArray(requiredRoles)) {
      requiredRoles = [requiredRoles];
    }

    // Check if user's role is in the list of required roles
    if (!requiredRoles.includes(req.role)) {
      return res.status(403).json({ error: 'Insufficient permissions for this action' });
    }

    // User has required role, proceed to next middleware
    next();
  };
};

/**
 * PERMISSION CHECKING MIDDLEWARE
 * 
 * Validates that user's role has specific permission
 * More granular than role checking - used for specific features
 * 
 * @param {string} permission - Permission name to check (e.g., 'canEditAll')
 * @returns {Function} - Express middleware function
 * 
 * Example:
 * router.post('/template', checkPermission('canCreateTemplates'), createTemplate)
 * router.put('/equipment/:id', checkPermission('canEditAll'), editEquipment)
 */
const checkPermission = (permission) => {
  return (req, res, next) => {
    // Verify role is attached to request
    if (!req.role) {
      return res.status(401).json({ error: 'User role not found' });
    }

    // Check if user's role has the required permission
    if (!PERMISSIONS[req.role] || !PERMISSIONS[req.role][permission]) {
      return res.status(403).json({ error: `Permission denied: ${permission}` });
    }

    // User has required permission, proceed
    next();
  };
};

/**
 * OWNERSHIP OR ADMIN CHECKING MIDDLEWARE
 * 
 * Allows users to modify their own resources or admins to modify anything
 * Useful for profile updates, personal settings, etc.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * Expected: resourceUserId in req.body.userId or req.params.userId
 * 
 * Example:
 * router.put('/profile/:userId', checkOwnershipOrAdmin, updateProfile)
 * router.put('/settings/:userId', checkOwnershipOrAdmin, updateSettings)
 */
const checkOwnershipOrAdmin = (req, res, next) => {
  // Get the user ID of the resource being modified
  const resourceUserId = req.body.userId || req.params.userId;
  
  // Allow if:
  // 1. User is admin (can modify anything)
  // 2. User ID matches resource owner ID
  if (req.role === 'admin' || Number(req.userId) === Number(resourceUserId)) {
    return next();
  }

  // User is neither owner nor admin
  return res.status(403).json({ error: 'You can only modify your own resources' });
};

module.exports = {
  checkRole,
  checkPermission,
  checkOwnershipOrAdmin,
  PERMISSIONS,
};
