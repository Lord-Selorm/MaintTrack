const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logActivity } = require('../middleware/audit');

const JWT_SECRET = process.env.JWT_SECRET;

function loginReqContext(req, userId) {
  return { userId, ip: req.ip, connection: req.connection, headers: req.headers };
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = await User.create({
      email,
      password,
      name: name || '',
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    await logActivity({
      req: loginReqContext(req, user.id),
      action: 'REGISTER',
      entityType: 'USER',
      entityId: user.id,
      newValues: { email: user.email },
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      await logActivity({
        req: loginReqContext(req, null),
        action: 'LOGIN_FAILED',
        entityType: 'AUTH',
        newValues: { email, reason: 'Unknown email' },
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      await logActivity({
        req: loginReqContext(req, user.id),
        action: 'LOGIN_FAILED',
        entityType: 'AUTH',
        entityId: user.id,
        newValues: { email: user.email, reason: 'Bad password' },
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    if (user.isActive) {
      await logActivity({
        req: loginReqContext(req, user.id),
        action: 'LOGIN',
        entityType: 'AUTH',
        entityId: user.id,
        newValues: { email: user.email },
      });
    } else {
      return res.status(403).json({ error: 'Account disabled' });
    }

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        phone: user.phone,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const auth = require('../middleware/auth');

// Development helper: expose seed admin credentials for the login screen
router.get('/seed-info', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const seedFile = path.join(__dirname, '../seed-info.json');
    if (fs.existsSync(seedFile)) {
      res.json(JSON.parse(fs.readFileSync(seedFile, 'utf8')));
    } else {
      res.json({ adminEmail: 'admin@example.com', adminPassword: 'admin123' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Update own profile (name, department, phone)
router.put('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const oldValues = { name: user.name, department: user.department, phone: user.phone };
    const { name, department, phone } = req.body;

    if (name !== undefined) user.name = name;
    if (department !== undefined) user.department = department;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    await logActivity({
      req,
      action: 'UPDATE',
      entityType: 'USER',
      entityId: user.id,
      oldValues,
      newValues: { name: user.name, department: user.department, phone: user.phone },
    });

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      phone: user.phone,
      isActive: user.isActive,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change own password (verify current password)
router.put('/me/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    await logActivity({
      req,
      action: 'UPDATE',
      entityType: 'USER',
      entityId: user.id,
      newValues: { passwordChanged: true },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

