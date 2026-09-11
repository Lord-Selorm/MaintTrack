/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AUDIT LOGGING HELPER
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Purpose: Records audit trail entries whenever critical data is created,
 * updated, deleted, or viewed. Called from route handlers after successful
 * operations.
 *
 * Usage:
 *   const { logActivity } = require('../middleware/audit');
 *   await logActivity({
 *     req,
 *     action: 'CREATE',
 *     entityType: 'EQUIPMENT',
 *     entityId: equipment.id,
 *     changes: { oldValues, newValues },
 *   });
 * ═══════════════════════════════════════════════════════════════════════════
 */
const AuditLog = require('../models/AuditLog');

async function logActivity({ req, action, entityType, entityId, newValues = null, oldValues = null }) {
  try {
    await AuditLog.create({
      userId: req.userId,
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      changes: newValues && oldValues ? { oldValues, newValues } : (newValues || oldValues),
      ipAddress: req.ip || req.connection?.remoteAddress || null,
      userAgent: (req.headers['user-agent'] || '').slice(0, 500),
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

module.exports = { logActivity };