/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BACKUP / EXPORT ROUTE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Purpose: Export the entire dataset (equipment, work, schedules, checklists,
 * users, alerts, health, checklists completions, audit logs) as a single JSON
 * payload. Admin / manager only.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { logActivity } = require('../middleware/audit');

const User = require('../models/User');
const Equipment = require('../models/Equipment');
const Work = require('../models/Work');
const Alert = require('../models/Alert');
const AuditLog = require('../models/AuditLog');
const Checklist = require('../models/Checklist');
const ChecklistCompletion = require('../models/ChecklistCompletion');
const MaintenanceSchedule = require('../models/MaintenanceSchedule');
const EquipmentHealth = require('../models/EquipmentHealth');
const WorkAttachment = require('../models/WorkAttachment');

// Export full database as JSON
router.get('/export', auth, checkPermission('canManageUsers'), async (req, res) => {
  try {
    const backup = await buildBackup();

    await logActivity({
      req, action: 'BACKUP', entityType: 'BACKUP',
      entityId: null,
      newValues: { backupExport: true },
    });

    res.json(backup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download backup as a .json attachment
router.get('/download', auth, checkPermission('canManageUsers'), async (req, res) => {
  try {
    const backup = await buildBackup();

    await logActivity({
      req, action: 'BACKUP', entityType: 'BACKUP',
      entityId: null,
      newValues: { backupDownload: true },
    });

    const fileName = `maintenance_backup_${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(backup, null, 2));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function buildBackup() {
  const [users, equipment, works, alerts, auditLogs, checklists, completions, schedules, health, attachments] = await Promise.all([
    User.findAll({ order: [['createdAt', 'ASC']] }),
    Equipment.findAll({ order: [['id', 'ASC']] }),
    Work.findAll({ order: [['id', 'ASC']] }),
    Alert.findAll({ order: [['id', 'ASC']] }),
    AuditLog.findAll({ order: [['id', 'ASC']] }),
    Checklist.findAll({ order: [['id', 'ASC']] }),
    ChecklistCompletion.findAll({ order: [['id', 'ASC']] }),
    MaintenanceSchedule.findAll({ order: [['id', 'ASC']] }),
    EquipmentHealth.findAll({ order: [['id', 'ASC']] }),
    WorkAttachment.findAll({ order: [['id', 'ASC']] }),
  ]);

  const stripPasswords = (rows) => rows.map(r => {
    const json = r.toJSON();
    delete json.password;
    return json;
  });

  return {
    meta: {
      app: 'Equipment Maintenance Tracker',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      counts: {
        users: users.length, equipment: equipment.length, works: works.length,
        alerts: alerts.length, auditLogs: auditLogs.length, checklists: checklists.length,
        completions: completions.length, schedules: schedules.length,
        health: health.length, attachments: attachments.length,
      },
    },
    users: stripPasswords(users),
    equipment,
    work: works,
    alerts,
    auditLogs,
    checklists,
    completions,
    schedules,
    health,
    attachments,
  };
}

module.exports = router;