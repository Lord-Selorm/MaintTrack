const express = require('express');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const auth = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { logActivity } = require('../middleware/audit');
const Work = require('../models/Work');
const Equipment = require('../models/Equipment');
const WorkAttachment = require('../models/WorkAttachment');
const config = require('../config');

const uploadDir = path.join(config.uploadsDir, 'attachments');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^(image\/|video\/|application\/pdf|text\/|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  }
});

// Get recent work for dashboard
router.get('/dashboard/recent', auth, async (req, res) => {
  try {
    const works = await Work.findAll({
      where: {},
      order: [['date', 'DESC']],
      limit: 6,
      include: [{
        model: Equipment,
        as: 'equipment',
        attributes: ['id', 'name', 'serial']
      }]
    });
    res.json(works);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all work records
router.get('/', auth, async (req, res) => {
  try {
    const equipId = req.query.equipId || '';
    const type = req.query.type || '';
    const month = req.query.month || '';

    let where = {};
    if (equipId) where.equipId = equipId;
    if (type) where.type = type;
    if (month) {
      const startDate = new Date(month);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      where.date = { [Op.gte]: startDate, [Op.lte]: endDate };
    }

    const works = await Work.findAll({
      where,
      include: [{
        model: Equipment,
        as: 'equipment',
        attributes: ['id', 'name', 'serial']
      }, {
        model: WorkAttachment,
        as: 'attachments',
        attributes: ['id', 'fileName', 'fileType', 'uploadedAt']
      }],
      order: [['date', 'DESC']]
    });
    res.json(works);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single work record
router.get('/:id', auth, async (req, res) => {
  try {
    const work = await Work.findOne({
      where: { id: req.params.id },
      include: [{
        model: Equipment,
        as: 'equipment',
        attributes: ['id', 'name', 'serial']
      }, {
        model: WorkAttachment,
        as: 'attachments',
        attributes: ['id', 'fileName', 'fileType', 'uploadedAt']
      }]
    });
    if (!work) {
      return res.status(404).json({ error: 'Work record not found' });
    }
    res.json(work);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create work record
router.post('/', auth, async (req, res) => {
  try {
    const { equipId, type, date, tech, dur, cost, desc } = req.body;

    if (!equipId || !desc) {
      return res.status(400).json({ error: 'Equipment and description are required' });
    }

    const equipment = await Equipment.findOne({
      where: { id: equipId }
    });
    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    const work = await Work.create({
      equipId,
      type: type || 'Maintenance',
      date: date || new Date(),
      tech: tech || '',
      dur: dur || 0,
      cost: cost || 0,
      desc,
      userId: req.userId,
      approvalStatus: 'Pending',
    });

    await logActivity({
      req,
      action: 'CREATE',
      entityType: 'WORK',
      entityId: work.id,
      newValues: { equipId, type: work.type, desc: work.desc, cost: work.cost, date: work.date },
    });

    res.status(201).json(work);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload attachment to work record
router.post('/:id/attachments', auth, upload.single('attachment'), async (req, res) => {
  try {
    const work = await Work.findOne({ where: { id: req.params.id } });
    if (!work) return res.status(404).json({ error: 'Work record not found' });
    if (!req.file) return res.status(400).json({ error: 'Attachment required' });

    const fileType = req.file.mimetype.startsWith('image/') ? 'IMAGE'
      : req.file.mimetype.startsWith('video/') ? 'VIDEO'
      : req.file.mimetype.includes('pdf') ? 'PDF'
      : 'DOCUMENT';

    const attachment = await WorkAttachment.create({
      workId: req.params.id,
      filePath: req.file.path,
      fileName: req.file.originalname,
      fileType,
      uploadedAt: new Date()
    });

    res.status(201).json(attachment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List attachments for a work record
router.get('/:id/attachments', auth, async (req, res) => {
  try {
    const work = await Work.findOne({ where: { id: req.params.id } });
    if (!work) return res.status(404).json({ error: 'Work record not found' });

    const attachments = await WorkAttachment.findAll({ where: { workId: req.params.id } });
    res.json(attachments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download a work attachment
router.get('/:id/attachments/:attachmentId/download', auth, async (req, res) => {
  try {
    const work = await Work.findOne({ where: { id: req.params.id } });
    if (!work) return res.status(404).json({ error: 'Work record not found' });

    const attachment = await WorkAttachment.findOne({ where: { id: req.params.attachmentId, workId: req.params.id } });
    if (!attachment) return res.status(404).json({ error: 'Attachment not found' });

    if (!fs.existsSync(attachment.filePath)) {
      return res.status(404).json({ error: 'Attachment file missing' });
    }

    res.download(attachment.filePath, attachment.fileName);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete work attachment
router.delete('/:id/attachments/:attachmentId', auth, async (req, res) => {
  try {
    const work = await Work.findOne({ where: { id: req.params.id } });
    if (!work) return res.status(404).json({ error: 'Work record not found' });

    const attachment = await WorkAttachment.findOne({ where: { id: req.params.attachmentId, workId: req.params.id } });
    if (!attachment) return res.status(404).json({ error: 'Attachment not found' });

    if (fs.existsSync(attachment.filePath)) {
      fs.unlinkSync(attachment.filePath);
    }
    await attachment.destroy();
    res.json({ message: 'Attachment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve a work record (pending -> approved)
router.put('/:id/approve', auth, checkPermission('canApproveWork'), async (req, res) => {
  try {
    const work = await Work.findOne({ where: { id: req.params.id } });
    if (!work) {
      return res.status(404).json({ error: 'Work record not found' });
    }
    const oldStatus = work.approvalStatus;
    await work.update({
      approvalStatus: 'Approved',
      approvedBy: req.userId,
      approvedAt: new Date(),
    });
    await logActivity({
      req,
      action: 'UPDATE',
      entityType: 'WORK',
      entityId: work.id,
      oldValues: { approvalStatus: oldStatus },
      newValues: { approvalStatus: 'Approved' },
    });
    res.json(work);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject a work record
router.put('/:id/reject', auth, checkPermission('canApproveWork'), async (req, res) => {
  try {
    const work = await Work.findOne({ where: { id: req.params.id } });
    if (!work) {
      return res.status(404).json({ error: 'Work record not found' });
    }
    const oldStatus = work.approvalStatus;
    await work.update({
      approvalStatus: 'Rejected',
      approvedBy: req.userId,
      approvedAt: new Date(),
    });
    await logActivity({
      req,
      action: 'UPDATE',
      entityType: 'WORK',
      entityId: work.id,
      oldValues: { approvalStatus: oldStatus },
      newValues: { approvalStatus: 'Rejected' },
    });
    res.json(work);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update work record
router.put('/:id', auth, async (req, res) => {
  try {
    const work = await Work.findOne({
      where: { id: req.params.id }
    });
    if (!work) {
      return res.status(404).json({ error: 'Work record not found' });
    }
    const updateData = { ...req.body };
    delete updateData.userId;
    // Prevent client from directly setting approval fields
    delete updateData.approvalStatus;
    delete updateData.approvedBy;
    delete updateData.approvedAt;
    const oldValues = {
      type: work.type, date: work.date, tech: work.tech,
      dur: work.dur, cost: work.cost, desc: work.desc,
    };
    await work.update(updateData);
    await logActivity({
      req,
      action: 'UPDATE',
      entityType: 'WORK',
      entityId: work.id,
      oldValues,
      newValues: { type: work.type, date: work.date, tech: work.tech, dur: work.dur, cost: work.cost, desc: work.desc },
    });
    const updated = await Work.findOne({
      where: { id: req.params.id },
      include: [{
        model: Equipment,
        as: 'equipment',
        attributes: ['id', 'name', 'serial']
      }]
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete work record
router.delete('/:id', auth, async (req, res) => {
  try {
    const work = await Work.findOne({
      where: { id: req.params.id }
    });
    if (!work) {
      return res.status(404).json({ error: 'Work record not found' });
    }
    const oldValues = work.toJSON();
    await work.destroy();
    await logActivity({
      req,
      action: 'DELETE',
      entityType: 'WORK',
      entityId: Number(req.params.id),
      oldValues: { equipId: oldValues.equipId, type: oldValues.type, desc: oldValues.desc, cost: oldValues.cost },
    });
    res.json({ message: 'Work record deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
