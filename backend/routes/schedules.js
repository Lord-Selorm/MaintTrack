/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MAINTENANCE SCHEDULING ROUTES
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Manage scheduled maintenance tasks for equipment
 * 
 * Endpoints:
 * - GET    /api/schedules              Get all schedules for user
 * - GET    /api/schedules/upcoming     Get schedules for next 30 days
 * - GET    /api/schedules/equipment/:id Get schedules for specific equipment
 * - POST   /api/schedules              Create new maintenance schedule
 * - PUT    /api/schedules/:id          Update schedule (status, date, etc.)
 * - POST   /api/schedules/:id/complete Mark schedule as completed
 * - DELETE /api/schedules/:id          Delete schedule
 * 
 * Schedule Statuses:
 * - Scheduled: Maintenance is planned
 * - In Progress: Currently being worked on
 * - Completed: Successfully finished
 * - Postponed: Delayed for later
 * - Cancelled: No longer needed
 * 
 * Priority Levels:
 * - Low: Non-urgent maintenance
 * - Normal: Regular maintenance
 * - High: Important maintenance
 * - Critical: Equipment may fail soon
 * 
 * Maintenance Types:
 * - Maintenance: Routine upkeep
 * - Repair: Fix broken equipment
 * - Inspection: Check equipment condition
 * - Preventive: Proactive maintenance to avoid failures
 * 
 * Security:
 * - All endpoints require authentication
 * - POST requires 'canAssignWork' permission
 * - Users can only see their own schedules
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');              // JWT authentication
const { checkPermission } = require('../middleware/rbac'); // Permission checking
const { logActivity } = require('../middleware/audit');    // Audit logging
const MaintenanceSchedule = require('../models/MaintenanceSchedule');
const EquipmentHealth = require('../models/EquipmentHealth');

/**
 * GET /api/schedules
 * Get all maintenance schedules
 * 
 * Query Params:
 * - status: Filter by status (optional)
 *   Example: /api/schedules?status=Scheduled
 * 
 * Response:
 * [
 *   {
 *     id: 1,
 *     userId: 123,
 *     equipId: 5,
 *     scheduledDate: "2026-06-15",
 *     maintenanceType: "Maintenance",
 *     priority: "High",
 *     status: "Scheduled",
 *     description: "Oil change and filter replacement",
 *     estimatedCost: 150.00,
 *     assignedTo: 456,
 *     completedDate: null
 *   },
 *   ...
 * ]
 */
router.get('/', auth, async (req, res) => {
  try {
    // Build filter based on query parameters
    const filter = req.query.status 
      ? { userId: req.userId, status: req.query.status } 
      : { userId: req.userId };
    
    // Fetch schedules ordered by date
    const schedules = await MaintenanceSchedule.findAll({
      where: filter,
      order: [['scheduledDate', 'ASC']],  // Earliest first
    });

    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/schedules/upcoming
 * Get maintenance schedules for the next 30 days
 * 
 * Useful for:
 * - Showing upcoming maintenance on dashboard
 * - Alerting users of upcoming tasks
 * - Planning maintenance window
 * 
 * Response: Array of schedules within next 30 days
 */
router.get('/upcoming', auth, async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Get schedules between today and 30 days from now
    const schedules = await MaintenanceSchedule.findAll({
      where: {
        userId: req.userId,
        scheduledDate: {
          // Between operator from Sequelize
          [require('sequelize').Op.between]: [today, thirtyDaysLater],
        },
        status: ['Scheduled', 'In Progress'],  // Only active schedules
      },
      order: [['scheduledDate', 'ASC']],
    });

    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/schedules
 * Create a new maintenance schedule
 * 
 * Requires Permission: canAssignWork
 * 
 * Body:
 * {
 *   equipId: 5,                        // Equipment to maintain
 *   scheduledDate: "2026-06-15",       // When to do maintenance
 *   maintenanceType: "Maintenance",    // Type of maintenance
 *   priority: "High",                  // Priority level
 *   description: "Oil change",         // What to do
 *   estimatedCost: 150.00,             // Budget estimate
 *   assignedTo: 456                    // Technician to assign to
 * }
 * 
 * Response: Created schedule with ID
 * Error: 400 if required fields missing
 */
router.post('/', auth, checkPermission('canAssignWork'), async (req, res) => {
  try {
    const { equipId, scheduledDate, maintenanceType, priority, description, estimatedCost, assignedTo } = req.body;

    // Validate required fields
    if (!equipId || !scheduledDate) {
      return res.status(400).json({ error: 'Equipment ID and scheduled date are required' });
    }

    // Create schedule record
    const schedule = await MaintenanceSchedule.create({
      userId: req.userId,
      equipId,
      scheduledDate: new Date(scheduledDate),
      maintenanceType: maintenanceType || 'Maintenance',
      priority: priority || 'Normal',
      description,
      estimatedCost,
      assignedTo,  // Technician assigned to this task
      status: 'Scheduled',  // Initial status
    });

    await logActivity({
      req,
      action: 'CREATE',
      entityType: 'WORK',
      entityId: schedule.id,
      newValues: { equipId, scheduledDate, maintenanceType: schedule.maintenanceType, priority: schedule.priority, description },
    });

    res.status(201).json(schedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/schedules/:id
 * Update an existing schedule
 * 
 * Can update: status, date, priority, description, cost, assignee
 * 
 * Body: Fields to update
 * Example:
 * {
 *   status: "In Progress",
 *   priority: "Critical"
 * }
 * 
 * Response: Updated schedule
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const schedule = await MaintenanceSchedule.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const { scheduledDate, status, priority, description, estimatedCost, completedDate, notes } = req.body;

    await schedule.update({
      scheduledDate: scheduledDate ? new Date(scheduledDate) : schedule.scheduledDate,
      status: status || schedule.status,
      priority: priority || schedule.priority,
      description: description || schedule.description,
      estimatedCost: estimatedCost || schedule.estimatedCost,
      completedDate: completedDate ? new Date(completedDate) : schedule.completedDate,
      notes: notes || schedule.notes,
    });

    await logActivity({
      req,
      action: 'UPDATE',
      entityType: 'WORK',
      entityId: schedule.id,
      newValues: { scheduledDate: schedule.scheduledDate, status: schedule.status, priority: schedule.priority },
    });

    res.json(schedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark as completed
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const schedule = await MaintenanceSchedule.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    await schedule.update({
      status: 'Completed',
      completedDate: new Date(),
    });

    await logActivity({
      req,
      action: 'UPDATE',
      entityType: 'WORK',
      entityId: schedule.id,
      newValues: { status: 'Completed', completedDate: new Date() },
    });

    res.json(schedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete schedule
router.delete('/:id', auth, checkPermission('canDeleteAll'), async (req, res) => {
  try {
    const schedule = await MaintenanceSchedule.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const snapshot = schedule.toJSON();
    await schedule.destroy();
    await logActivity({
      req,
      action: 'DELETE',
      entityType: 'WORK',
      entityId: Number(req.params.id),
      oldValues: { equipId: snapshot.equipId, scheduledDate: snapshot.scheduledDate, status: snapshot.status },
    });
    res.json({ message: 'Schedule deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get schedules for specific equipment
router.get('/equipment/:equipId', auth, async (req, res) => {
  try {
    const schedules = await MaintenanceSchedule.findAll({
      where: {
        userId: req.userId,
        equipId: req.params.equipId,
      },
      order: [['scheduledDate', 'DESC']],
    });

    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
