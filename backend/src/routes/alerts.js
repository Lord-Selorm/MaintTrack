const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Alert = require('../models/Alert');
const AlertService = require('../utils/alertService');

// Get all alerts for user
router.get('/', auth, async (req, res) => {
  try {
    const alerts = await AlertService.getAlerts(req.userId);
    const unreadCount = alerts.filter(a => !a.isRead).length;
    
    res.json({
      alerts,
      unreadCount,
      total: alerts.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get unread alerts only
router.get('/unread', auth, async (req, res) => {
  try {
    const alerts = await Alert.findAll({
      where: { userId: req.userId, isRead: false },
      order: [['createdAt', 'DESC']],
      limit: 10,
    });
    
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate alerts for user
router.post('/generate', auth, async (req, res) => {
  try {
    const alerts = await AlertService.generateAlertsForUser(req.userId);
    
    // Save only new alerts (don't duplicate)
    for (const alertData of alerts) {
      const existing = await Alert.findOne({
        where: {
          userId: req.userId,
          type: alertData.type,
          equipId: alertData.equipId,
          isRead: false,
        },
      });

      if (!existing) {
        await Alert.create(alertData);
      }
    }

    res.json({ message: 'Alerts generated', count: alerts.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all alerts as read (must be before /:id routes)
router.put('/all/read', auth, async (req, res) => {
  try {
    await Alert.update(
      { isRead: true },
      { where: { userId: req.userId, isRead: false } }
    );

    res.json({ message: 'All alerts marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear old alerts (must be before /:id routes)
router.delete('/clear/old', auth, async (req, res) => {
  try {
    await Alert.destroy({
      where: {
        userId: req.userId,
        createdAt: { [require('sequelize').Op.lt]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    });
    res.json({ message: 'Old alerts cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark alert as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const alert = await Alert.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    await alert.update({ isRead: true });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete alert
router.delete('/:id', auth, async (req, res) => {
  try {
    const alert = await Alert.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    await alert.destroy();
    res.json({ message: 'Alert deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
