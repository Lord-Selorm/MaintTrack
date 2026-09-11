const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Equipment = require('../models/Equipment');
const Work = require('../models/Work');
const AnalyticsService = require('../utils/analyticsService');

// Get cost analytics dashboard
router.get('/cost-analytics', auth, async (req, res) => {
  try {
    const equipment = await Equipment.findAll({
      where: { userId: req.userId },
    });

    const works = await Work.findAll({
      where: { userId: req.userId },
    });

    const analytics = AnalyticsService.generateCostAnalytics(equipment, works);

    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get predictive maintenance suggestions
router.get('/predictive-maintenance', auth, async (req, res) => {
  try {
    const equipment = await Equipment.findAll({
      where: { userId: req.userId },
    });

    const works = await Work.findAll({
      where: { userId: req.userId },
    });

    const suggestions = AnalyticsService.getPredictiveSuggestions(equipment, works);

    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get monthly spending trends (for charts)
router.get('/spending-trends', auth, async (req, res) => {
  try {
    const works = await Work.findAll({
      where: { userId: req.userId },
    });

    const trends = AnalyticsService.calculateMonthlyTrends(works);

    res.json(trends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get equipment type breakdown
router.get('/equipment-types', auth, async (req, res) => {
  try {
    const equipment = await Equipment.findAll({
      where: { userId: req.userId },
    });

    const works = await Work.findAll({
      where: { userId: req.userId },
    });

    const breakdown = AnalyticsService.groupByEquipmentType(equipment, works);

    res.json(breakdown);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get work type breakdown
router.get('/work-types', auth, async (req, res) => {
  try {
    const works = await Work.findAll({
      where: { userId: req.userId },
    });

    const breakdown = AnalyticsService.groupByWorkType(works);

    res.json(breakdown);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get top expensive equipment
router.get('/top-expensive', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const equipment = await Equipment.findAll({
      where: { userId: req.userId },
    });

    const works = await Work.findAll({
      where: { userId: req.userId },
    });

    const topExpensive = AnalyticsService.getTopExpensiveEquipment(equipment, works, limit);

    res.json(topExpensive);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
