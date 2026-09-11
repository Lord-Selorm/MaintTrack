/**
 * ═══════════════════════════════════════════════════════════════════════════
 * USER MANAGEMENT ROUTES (ADMIN)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Purpose: Admin-only user administration endpoints.
 * - List all users
 * - Create / invite users with a role
 * - Update user details, role, and account status
 * - Reset a user's password
 * - Delete a user (except self)
 *
 * All routes require auth + canManageUsers (admin only).
 * ═══════════════════════════════════════════════════════════════════════════
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { logActivity } = require('../middleware/audit');
const User = require('../models/User');

const sanitizeUser = (u) => {
  const json = u.toJSON ? u.toJSON() : u;
  delete json.password;
  return json;
};

// List all users (excludes passwords)
router.get('/', auth, checkPermission('canManageUsers'), async (req, res) => {
  try {
    const users = await User.findAll({ order: [['createdAt', 'DESC']] });
    res.json(users.map(sanitizeUser));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new user (admin invite)
router.post('/', auth, checkPermission('canManageUsers'), async (req, res) => {
  try {
    const { email, password, name, role, department, phone, isActive } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = await User.create({
      email,
      password,
      name: name || '',
      role: role || 'technician',
      department: department || null,
      phone: phone || null,
      isActive: isActive !== undefined ? isActive : true,
    });

    await logActivity({
      req,
      action: 'CREATE',
      entityType: 'USER',
      entityId: user.id,
      newValues: { email: user.email, name: user.name, role: user.role, isActive: user.isActive },
    });

    res.status(201).json(sanitizeUser(user));
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError' || err.message?.includes('already exists')) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Update a user (role, name, department, phone, active status)
router.put('/:id', auth, checkPermission('canManageUsers'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const oldValues = {
      name: user.name, role: user.role, department: user.department,
      phone: user.phone, isActive: user.isActive,
    };

    const { name, role, department, phone, isActive } = req.body;
    if (name !== undefined) user.name = name;
    if (role !== undefined) {
      if (!['admin', 'manager', 'technician', 'viewer'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      user.role = role;
    }
    if (department !== undefined) user.department = department;
    if (phone !== undefined) user.phone = phone;
    if (isActive !== undefined) user.isActive = !!isActive;

    await user.save();

    await logActivity({
      req,
      action: 'UPDATE',
      entityType: 'USER',
      entityId: user.id,
      oldValues,
      newValues: {
        name: user.name, role: user.role, department: user.department,
        phone: user.phone, isActive: user.isActive,
      },
    });

    res.json(sanitizeUser(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset a user's password (admin override)
router.put('/:id/password', auth, checkPermission('canManageUsers'), async (req, res) => {
  try {
    if (Number(req.params.id) === Number(req.userId)) {
      return res.status(400).json({ error: 'Use the profile password change for your own account' });
    }
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.password = password;
    await user.save();

    await logActivity({
      req, action: 'UPDATE', entityType: 'USER', entityId: user.id,
      newValues: { passwordReset: true },
    });

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a user (cannot delete self)
router.delete('/:id', auth, checkPermission('canManageUsers'), async (req, res) => {
  try {
    if (Number(req.params.id) === Number(req.userId)) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const snapshot = { email: user.email, name: user.name, role: user.role };
    await user.destroy();
    await logActivity({
      req, action: 'DELETE', entityType: 'USER', entityId: Number(req.params.id),
      oldValues: snapshot,
    });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;