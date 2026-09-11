const express = require('express');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const auth = require('../middleware/auth');
const { logActivity } = require('../middleware/audit');
const Equipment = require('../models/Equipment');
const Work = require('../models/Work');
const config = require('../config');

// Setup multer for file uploads
const uploadDir = path.join(config.uploadsDir, 'manuals');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Allow PDF, Word, images, and text files
    const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/png'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, Word, Text, Images'));
    }
  }
});

// Get dashboard metrics (must be before /:id to avoid route collision)
router.get('/dashboard/metrics', auth, async (req, res) => {
  try {
    const totalEquipment = await Equipment.count({ where: {} });
    const active = await Equipment.count({ where: { status: 'Active' } });
    const underRepair = await Equipment.count({ where: { status: 'Under Repair' } });
    const totalCost = await Work.sum('cost') || 0;
    const totalWorks = await Work.count({ where: {} });

    res.json({
      totalEquipment,
      active,
      underRepair,
      totalWorks,
      totalCost,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all equipment for a user
router.get('/', auth, async (req, res) => {
  try {
    const search = req.query.search?.toLowerCase() || '';
    const type = req.query.type || '';
    const status = req.query.status || '';

    let where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { serial: { [Op.like]: `%${search}%` } },
      ];
    }
    if (type) where.type = type;
    if (status) where.status = status;

    const equipment = await Equipment.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });
    res.json(equipment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single equipment with work records
router.get('/:id', auth, async (req, res) => {
  try {
    const equipment = await Equipment.findOne({
      where: { id: req.params.id }
    });
    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    const works = await Work.findAll({
      where: { equipId: req.params.id },
      order: [['date', 'ASC']]
    });
    res.json({ ...equipment.toJSON(), works });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create equipment
router.post('/', auth, async (req, res) => {
  try {
    const { name, serial, type, status, installed, lifespan, location, notes, purchasePrice, warrantyExpiration, warrantyTerms } = req.body;

    if (!name || !serial) {
      return res.status(400).json({ error: 'Name and serial are required' });
    }

    const equipment = await Equipment.create({
      name,
      serial,
      type: type || 'Other',
      status: status || 'Active',
      installed: installed || new Date(),
      lifespan: lifespan || 10,
      purchasePrice: purchasePrice || null,
      warrantyExpiration: warrantyExpiration || null,
      warrantyTerms: warrantyTerms || null,
      location: location || '',
      notes: notes || '',
      userId: req.userId,
    });

    await logActivity({
      req,
      action: 'CREATE',
      entityType: 'EQUIPMENT',
      entityId: equipment.id,
      newValues: { name, serial, type: equipment.type, status: equipment.status, location: equipment.location },
    });

    res.status(201).json(equipment);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Serial number already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Update equipment
router.put('/:id', auth, async (req, res) => {
  try {
    const equipment = await Equipment.findOne({
      where: { id: req.params.id }
    });
    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    const updateData = { ...req.body };
    delete updateData.userId;
    const oldValues = equipment.toJSON();
    await equipment.update(updateData);
    await logActivity({
      req,
      action: 'UPDATE',
      entityType: 'EQUIPMENT',
      entityId: equipment.id,
      oldValues: { name: oldValues.name, serial: oldValues.serial, status: oldValues.status, location: oldValues.location },
      newValues: { name: equipment.name, serial: equipment.serial, status: equipment.status, location: equipment.location },
    });
    res.json(equipment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete equipment and all related work
router.delete('/:id', auth, async (req, res) => {
  try {
    const equipment = await Equipment.findOne({
      where: { id: req.params.id }
    });
    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    const snapshot = equipment.toJSON();
    await equipment.destroy();
    await Work.destroy({ where: { equipId: req.params.id } });
    await logActivity({
      req,
      action: 'DELETE',
      entityType: 'EQUIPMENT',
      entityId: Number(req.params.id),
      oldValues: { name: snapshot.name, serial: snapshot.serial, status: snapshot.status },
    });
    res.json({ message: 'Equipment and all related work records deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload manual/documentation for equipment
router.post('/:id/manual', auth, upload.single('manual'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const equipment = await Equipment.findOne({
      where: { id: req.params.id }
    });

    if (!equipment) {
      // Delete uploaded file if equipment not found
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({ error: 'Equipment not found' });
    }

    // Delete old manual if exists
    if (equipment.manualPath && fs.existsSync(equipment.manualPath)) {
      fs.unlink(equipment.manualPath, () => {});
    }

    await equipment.update({
      manualPath: req.file.path,
      manualFileName: req.file.originalname
    });

    res.json({ 
      message: 'Manual uploaded successfully',
      equipment
    });
  } catch (err) {
    // Delete uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({ error: err.message });
  }
});

// Download manual for equipment
router.get('/:id/manual/download', auth, async (req, res) => {
  try {
    const equipment = await Equipment.findOne({
      where: { id: req.params.id }
    });

    if (!equipment || !equipment.manualPath) {
      return res.status(404).json({ error: 'Manual not found' });
    }

    if (!fs.existsSync(equipment.manualPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(equipment.manualPath, equipment.manualFileName);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete manual for equipment
router.delete('/:id/manual', auth, async (req, res) => {
  try {
    const equipment = await Equipment.findOne({
      where: { id: req.params.id }
    });

    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    if (equipment.manualPath && fs.existsSync(equipment.manualPath)) {
      fs.unlink(equipment.manualPath, () => {});
    }

    await equipment.update({
      manualPath: null,
      manualFileName: null
    });

    res.json({ message: 'Manual deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
