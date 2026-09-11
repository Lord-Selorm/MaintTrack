/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AUDIT LOG VIEWING ROUTES (ADMIN)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Purpose: Retrieve the audit trail. Admin only.
 * Supports filtering by action, entity type, user, and entity id.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();
const auth = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

// List audit logs with filters
router.get('/', auth, checkPermission('canManageUsers'), async (req, res) => {
  try {
    const { action, entityType, userId, search, limit } = req.query;
    const where = {};

    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (userId) where.userId = userId;

    const pageSize = Math.min(Number(limit) || 50, 200);
    const logs = await AuditLog.findAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'role'],
        required: false,
      }],
      order: [['createdAt', 'DESC']],
      limit: pageSize,
    });

    const all = logs.map(l => {
      const json = l.toJSON();
      if (json.user && json.user.id) json.userName = json.user.name || json.user.email;
      return json;
    });

    res.json(all);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get audit stats (counts per action over last 30 days)
router.get('/stats', auth, checkPermission('canManageUsers'), async (req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const logs = await AuditLog.findAll({
      where: { createdAt: { [Op.gte]: since } },
      attributes: ['action', 'entityType'],
    });

    const actionCounts = {};
    const entityCounts = {};
    logs.forEach(l => {
      actionCounts[l.action] = (actionCounts[l.action] || 0) + 1;
      entityCounts[l.entityType] = (entityCounts[l.entityType] || 0) + 1;
    });

    res.json({ total: logs.length, actionCounts, entityCounts, since });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;