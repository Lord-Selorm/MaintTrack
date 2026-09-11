/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EQUIPMENT HEALTH SCORING ROUTES
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Calculate and manage equipment health scores
 * 
 * Endpoints:
 * - GET    /api/health              Get all equipment health scores
 * - GET    /api/health/:equipId     Get single equipment health
 * - POST   /api/health/recalculate  Recalculate all health scores
 * - GET    /api/health/:equipId/recommendations  Get maintenance suggestions
 * 
 * Health Score Algorithm:
 * Base: 100 points
 * - Age Penalty: 10-40 points based on lifespan usage
 * - Repair Penalty: 10-20 points based on repair frequency
 * - Cost Penalty: 8-15 points based on average maintenance cost
 * - Status Penalty: 30-50 points based on current status
 * 
 * Health Status:
 * - 90+: Excellent (minimal maintenance needed)
 * - 75-90: Healthy (routine maintenance)
 * - 60-75: Fair (increased attention needed)
 * - 40-60: Poor (significant maintenance overdue)
 * - <40: Critical (equipment failing)
 * 
 * Failure Risk:
 * - Low: Score 80+, minimal repairs
 * - Medium: Score 60-80
 * - High: Score 40-60
 * - Critical: Score <40
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const EquipmentHealth = require('../models/EquipmentHealth');
const Equipment = require('../models/Equipment');
const Work = require('../models/Work');

/**
 * CALCULATE HEALTH SCORE
 * Algorithm to determine equipment health based on multiple factors
 * 
 * Factors Considered:
 * 1. Age vs Lifespan: How much of equipment's life has been used
 * 2. Repair Frequency: Number of times equipment has been repaired
 * 3. Maintenance Cost Trend: Average cost of maintenance
 * 4. Equipment Status: Is it active, under repair, or inactive
 * 
 * @param {Object} equipment - Equipment record with lifespan and dates
 * @param {Array} works - Work records for this equipment
 * @returns {number} - Score 0-100
 */
const calculateHealthScore = async (equipment, works) => {
  let score = 100;  // Start with perfect score
  
  // Calculate equipment age as percentage of lifespan
  const lifespanPercentage = equipment.lifespan > 0 
    ? (new Date() - new Date(equipment.installed)) / (equipment.lifespan * 365 * 24 * 60 * 60 * 1000) * 100 
    : 0;
  
  // AGE PENALTY
  // Equipment past 80% of lifespan is critical
  if (lifespanPercentage > 80) score -= 40;      // -40 points: Very old
  else if (lifespanPercentage > 60) score -= 25; // -25 points: Getting old
  else if (lifespanPercentage > 40) score -= 10; // -10 points: Approaching half-life

  // REPAIR FREQUENCY PENALTY
  // Count how many times this equipment was repaired
  const repairCount = works.filter(w => w.type === 'Repair').length || 0;
  if (repairCount > 5) score -= 20;      // -20 points: Frequent failures
  else if (repairCount > 3) score -= 10; // -10 points: Multiple repairs

  // AVERAGE MAINTENANCE COST PENALTY
  // Higher average cost indicates problems
  const avgCost = works.length > 0 
    ? works.reduce((sum, w) => sum + (w.cost || 0), 0) / works.length 
    : 0;
  if (avgCost > 500) score -= 15;      // -15 points: Very expensive to maintain
  else if (avgCost > 250) score -= 8;  // -8 points: Costly maintenance

  // STATUS PENALTY
  // Current status affects health
  if (equipment.status === 'Under Repair') score -= 30;  // Equipment is broken right now
  else if (equipment.status === 'Inactive') score -= 50; // Not being used (aging without use)

  // Ensure score stays within 0-100 range
  return Math.max(0, Math.min(100, score));
};

/**
 * GET HEALTH STATUS
 * Maps health score to descriptive status
 * 
 * @param {number} score - Health score 0-100
 * @returns {string} - Status: Excellent, Healthy, Fair, Poor, Critical, Offline
 */
const getHealthStatus = (score) => {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Healthy';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Poor';
  if (score > 0) return 'Critical';
  return 'Offline';
};

/**
 * GET FAILURE RISK LEVEL
 * Predicts probability of equipment failure
 * 
 * @param {number} score - Health score
 * @param {number} repairCount - Number of repairs
 * @returns {string} - Risk: Low, Medium, High, Critical
 */
const getFailureRiskLevel = (score, repairCount) => {
  if (score >= 80) return 'Low';           // Good condition
  if (score >= 60 || repairCount <= 2) return 'Medium';  // Acceptable
  if (score >= 40 || repairCount <= 4) return 'High';    // Risky
  return 'Critical';  // About to fail
};

/**
 * GET /api/health
 * Retrieve health scores for all equipment
 * 
 * Response:
 * [
 *   {
 *     id: 1,
 *     equipId: 5,
 *     userId: 123,
 *     healthScore: 85,
 *     status: "Healthy",
 *     agePercentage: 35,
 *     failureRiskLevel: "Low",
 *     recommendedAction: "Schedule quarterly inspection",
 *     nextScheduledMaintenance: "2026-07-02",
 *     lastCheckedDate: "2026-06-02"
 *   },
 *   ...
 * ]
 */
router.get('/', auth, async (req, res) => {
  try {
    // Get all equipment (shared)
    const equipment = await Equipment.findAll({ where: {} });
    
    // Get all health records
    const healths = await EquipmentHealth.findAll({ where: {} });

    res.json(healths);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/health/:equipId
 * Get or calculate health score for single equipment
 * 
 * If health record doesn't exist, calculates and creates it
 * 
 * Params:
 * - equipId: Equipment ID
 * 
 * Response: Health score object
 * Error: 404 if equipment not found
 */
router.get('/:equipId', auth, async (req, res) => {
  try {
    // Try to find existing health record by equipment id
    let health = await EquipmentHealth.findOne({
      where: { equipId: req.params.equipId },
    });

    if (!health) {
      // Calculate and create if doesn't exist
      const equipment = await Equipment.findOne({
        where: { id: req.params.equipId },
      });

      if (!equipment) {
        return res.status(404).json({ error: 'Equipment not found' });
      }

      const works = await Work.findAll({ where: { equipId: req.params.equipId } });
      const score = await calculateHealthScore(equipment, works);
      const status = getHealthStatus(score);
      const failureRisk = getFailureRiskLevel(score, works.filter(w => w.type === 'Repair').length);
      const agePercentage = equipment.lifespan > 0 ? Math.min(100, ((new Date() - new Date(equipment.installed)) / (equipment.lifespan * 365 * 24 * 60 * 60 * 1000)) * 100) : 0;

      health = await EquipmentHealth.create({
        userId: equipment.userId || req.userId,
        equipId: req.params.equipId,
        healthScore: Math.round(score),
        status,
        agePercentage: Math.round(agePercentage),
        failureRiskLevel: failureRisk,
      });
    }

    res.json(health);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Recalculate health for all equipment
router.post('/recalculate/all', auth, async (req, res) => {
  try {
    const equipment = await Equipment.findAll({ where: {} });
    const updates = [];

    for (const equip of equipment) {
      const works = await Work.findAll({ where: { equipId: equip.id } });
      const score = await calculateHealthScore(equip, works);
      const status = getHealthStatus(score);
      const failureRisk = getFailureRiskLevel(score, works.filter(w => w.type === 'Repair').length);
      const agePercentage = equip.lifespan > 0 ? Math.min(100, ((new Date() - new Date(equip.installed)) / (equip.lifespan * 365 * 24 * 60 * 60 * 1000)) * 100) : 0;

      const [health] = await EquipmentHealth.findOrCreate({
        where: { equipId: equip.id },
        defaults: {
          userId: equip.userId || req.userId,
          equipId: equip.id,
          healthScore: Math.round(score),
          status,
          agePercentage: Math.round(agePercentage),
          failureRiskLevel: failureRisk,
        },
      });

      if (health) {
        await health.update({
          healthScore: Math.round(score),
          status,
          agePercentage: Math.round(agePercentage),
          failureRiskLevel: failureRisk,
          lastCheckedDate: new Date(),
        });
      }

      updates.push(health);
    }

    res.json({ message: 'All equipment health recalculated', updated: updates.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get health recommendations
router.get('/:equipId/recommendations', auth, async (req, res) => {
  try {
    const health = await EquipmentHealth.findOne({
      where: { equipId: req.params.equipId },
    });

    if (!health) {
      return res.status(404).json({ error: 'Health data not found' });
    }

    let recommendations = [];
    
    if (health.healthScore < 40) {
      recommendations.push({
        priority: 'Critical',
        action: 'Schedule immediate maintenance',
        reason: 'Health score critically low',
      });
    }

    if (health.agePercentage > 80) {
      recommendations.push({
        priority: 'High',
        action: 'Plan equipment replacement',
        reason: 'Equipment nearing end of lifespan',
      });
    }

    if (health.failureRiskLevel === 'High' || health.failureRiskLevel === 'Critical') {
      recommendations.push({
        priority: 'High',
        action: 'Perform preventive maintenance',
        reason: 'Failure risk is high',
      });
    }

    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
