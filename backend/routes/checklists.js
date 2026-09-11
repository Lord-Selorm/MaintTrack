/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CHECKLIST ROUTES - Equipment Inspection Management
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: API endpoints for managing equipment inspection checklists
 * 
 * Endpoints:
 * - GET    /api/checklists              List all checklists for user
 * - GET    /api/checklists/templates/:type  Get templates by equipment type
 * - GET    /api/checklists/:id          Get single checklist
 * - POST   /api/checklists              Create new checklist
 * - PUT    /api/checklists/:id          Update checklist
 * - DELETE /api/checklists/:id          Delete checklist
 * - POST   /api/checklists/:id/complete Submit completed inspection
 * - GET    /api/checklists/completions  Get past completions
 * 
 * Security:
 * - All endpoints require authentication (auth middleware)
 * - POST /create requires 'canCreateTemplates' permission
 * - Users can only access their own checklists
 * 
 * Data Models:
 * - Checklist: Template/checklist definition
 * - ChecklistCompletion: Completed inspection results
 * 
 * Usage Flow:
 * 1. Get templates: GET /templates/AC Unit
 * 2. Create checklist: POST / with template data
 * 3. Use during inspection: Show items to inspector
 * 4. Submit results: POST /:id/complete with results
 * 5. View history: GET /completions
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');              // JWT token validation
const { checkPermission } = require('../middleware/rbac'); // Permission checking
const Checklist = require('../models/Checklist');
const ChecklistCompletion = require('../models/ChecklistCompletion');
const Work = require('../models/Work');
const User = require('../models/User');

/**
 * GET /api/checklists
 * List all checklists for the authenticated user
 * 
 * Response:
 * [
 *   {
 *     id: 1,
 *     userId: 123,
 *     name: "AC Unit Inspection",
 *     equipmentType: "AC Unit",
 *     items: [...],
 *     isTemplate: true,
 *     createdAt: "2026-06-02T..."
 *   },
 *   ...
 * ]
 */
router.get('/', auth, async (req, res) => {
  try {
    // Find all checklists created by this user
    const checklists = await Checklist.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']],  // Newest first
    });
    res.json(checklists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/checklists/templates/:equipmentType
 * Get pre-built templates for specific equipment type
 * 
 * Params:
 * - equipmentType: "AC Unit", "Generator", "Elevator", "HVAC", "Pump"
 * 
 * Response: Array of template checklists
 */
router.get('/templates/:equipmentType', auth, async (req, res) => {
  try {
    // Find templates matching this equipment type
    const checklists = await Checklist.findAll({
      where: {
        userId: req.userId,
        equipmentType: req.params.equipmentType,
        isTemplate: true,  // Only get templates, not user-created checklists
      },
    });
    res.json(checklists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/checklists/:id
 * Get a single checklist by ID
 * 
 * Params:
 * - id: Checklist ID
 * 
 * Response: Checklist object
 * Error: 404 if not found or not owned by user
 */
router.get('/:id', auth, async (req, res) => {
  try {
    // Verify user owns this checklist
    const checklist = await Checklist.findOne({
      where: { id: req.params.id, userId: req.userId },
    });
    
    if (!checklist) {
      return res.status(404).json({ error: 'Checklist not found' });
    }
    
    res.json(checklist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/checklists
 * Create a new checklist
 * 
 * Requires Permission: canCreateTemplates
 * 
 * Body:
 * {
 *   name: "AC Maintenance",
 *   description: "Monthly AC inspection",
 *   equipmentType: "AC Unit",
 *   items: [
 *     { label: "Check filter", completed: false },
 *     { label: "Check coolant", completed: false }
 *   ],
 *   isTemplate: true
 * }
 * 
 * Response: Created checklist with ID
 */
router.post('/', auth, checkPermission('canCreateTemplates'), async (req, res) => {
  try {
    const { name, description, equipmentType, items, isTemplate } = req.body;

    // Create checklist in database
    const checklist = await Checklist.create({
      userId: req.userId,          // Associate with current user
      name,
      description,
      equipmentType,
      items: items || [],          // Array of items to check
      isTemplate: isTemplate !== false,  // Default to true
    });

    res.status(201).json(checklist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/checklists/:id
 * Update an existing checklist
 * 
 * Body: Any fields to update
 * 
 * Response: Updated checklist
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const checklist = await Checklist.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!checklist) {
      return res.status(404).json({ error: 'Checklist not found' });
    }

    const { name, description, items } = req.body;
    
    await checklist.update({
      name: name || checklist.name,
      description: description || checklist.description,
      items: items || checklist.items,
    });

    res.json(checklist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get checklist completions (must be before /:id routes)
router.get('/completions/list', auth, async (req, res) => {
  try {
    const completions = await ChecklistCompletion.findAll({
      where: (req.role === 'admin' || req.role === 'manager') ? {} : { userId: req.userId },
      include: [{
        model: Checklist,
        as: 'checklist',
        attributes: ['id', 'name'],
        required: false,
      }],
      order: [['completedDate', 'DESC']],
      limit: 100,
    });
    const all = completions.map(c => {
      const json = c.toJSON();
      if (json.checklist && !json.name) json.name = json.checklist.name;
      delete json.checklist;
      return json;
    });
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete checklist
router.delete('/:id', auth, async (req, res) => {
  try {
    const checklist = await Checklist.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!checklist) {
      return res.status(404).json({ error: 'Checklist not found' });
    }

    await checklist.destroy();
    res.json({ message: 'Checklist deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit checklist completion
router.post('/:checklistId/complete', auth, async (req, res) => {
  try {
    const { equipId, workId, completedItems, issuesFound, recommendations, photos } = req.body;

    const checklist = await Checklist.findOne({
      where: { id: req.params.checklistId, userId: req.userId },
    });

    if (!checklist) {
      return res.status(404).json({ error: 'Checklist not found' });
    }

    const itemsCompleted = completedItems?.filter(item => item.completed).length || 0;
    const totalItems = completedItems?.length || 0;
    const completionPercentage = totalItems > 0 ? Math.round((itemsCompleted / totalItems) * 100) : 0;

    const user = await User.findByPk(req.userId);

    const completion = await ChecklistCompletion.create({
      userId: req.userId,
      checklistId: req.params.checklistId,
      equipId,
      workId,
      completedItems,
      itemsCompleted,
      totalItems,
      completionPercentage,
      issuesFound,
      recommendedActions: recommendations,
      photoUrls: photos || [],
      completedBy: user ? (user.name || user.email) : null,
    });

    res.status(201).json(completion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
