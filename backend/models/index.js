/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DATABASE MODEL ASSOCIATIONS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Defines relationships between database models
 * 
 * This file imports all models and establishes their associations.
 * Associations enable Sequelize to:
 * - Auto-load related data with queries
 * - Maintain referential integrity
 * - Provide convenient query methods
 * 
 * Association Types:
 * - hasMany: One-to-many relationship (User has many Equipment)
 * - hasOne: One-to-one relationship (Equipment has one Health score)
 * - belongsTo: Inverse of above (Equipment belongs to User)
 * 
 * Query Usage Example:
 * const user = await User.findByPk(1, { include: 'equipment' })
 * // user.equipment contains all equipment owned by this user
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────────
// MODEL IMPORTS
// ─────────────────────────────────────────────────────────────────────────
// Import all data models
const User = require('./User');                          // User accounts
const Equipment = require('./Equipment');                // Equipment/assets
const Work = require('./Work');                          // Work records/logs
const Alert = require('./Alert');                        // System alerts
const AuditLog = require('./AuditLog');                  // Activity logs
const Checklist = require('./Checklist');                // Inspection templates
const ChecklistCompletion = require('./ChecklistCompletion');  // Completed inspections
const MaintenanceSchedule = require('./MaintenanceSchedule');  // Scheduled maintenance
const EquipmentHealth = require('./EquipmentHealth');    // Equipment health scores
const WorkAttachment = require('./WorkAttachment');      // Photos/files attached to work

// ─────────────────────────────────────────────────────────────────────────
// ASSOCIATION DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────

/**
 * USER ↔ EQUIPMENT
 * One user can own many pieces of equipment
 * One equipment belongs to one user
 */
User.hasMany(Equipment, { foreignKey: 'userId', as: 'equipment' });
Equipment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

/**
 * USER ↔ WORK RECORDS
 * One user can log many work records
 * One work record belongs to one user
 */
User.hasMany(Work, { foreignKey: 'userId', as: 'work' });
Work.belongsTo(User, { foreignKey: 'userId', as: 'user' });

/**
 * EQUIPMENT ↔ WORK RECORDS
 * One piece of equipment can have many work records
 * One work record is performed on one equipment
 */
Equipment.hasMany(Work, { foreignKey: 'equipId', as: 'work' });
Work.belongsTo(Equipment, { foreignKey: 'equipId', as: 'equipment' });

/**
 * USER ↔ ALERTS
 * One user can receive many alerts
 * One alert belongs to one user
 */
User.hasMany(Alert, { foreignKey: 'userId', as: 'alerts' });
Alert.belongsTo(User, { foreignKey: 'userId', as: 'user' });

/**
 * USER ↔ AUDIT LOGS
 * One user can generate many audit log entries
 * One log entry involves one user
 */
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

/**
 * USER ↔ CHECKLISTS
 * One user can create many checklists
 * One checklist belongs to one user
 */
User.hasMany(Checklist, { foreignKey: 'userId', as: 'checklists' });
Checklist.belongsTo(User, { foreignKey: 'userId', as: 'user' });

/**
 * WORK ↔ WORK ATTACHMENTS
 * One work record can have many attachments (photos, documents)
 * One attachment belongs to one work record
 */
Work.hasMany(WorkAttachment, { foreignKey: 'workId', as: 'attachments' });
WorkAttachment.belongsTo(Work, { foreignKey: 'workId', as: 'work' });

/**
 * USER ↔ CHECKLIST COMPLETIONS
 * One user can complete many checklists
 * One checklist completion belongs to one user
 */
User.hasMany(ChecklistCompletion, { foreignKey: 'userId', as: 'checklistCompletions' });
ChecklistCompletion.belongsTo(User, { foreignKey: 'userId', as: 'user' });

/**
 * CHECKLIST ↔ CHECKLIST COMPLETIONS
 * One checklist can have many completion records
 * One completion record belongs to one checklist
 */
Checklist.hasMany(ChecklistCompletion, { foreignKey: 'checklistId', as: 'completions' });
ChecklistCompletion.belongsTo(Checklist, { foreignKey: 'checklistId', as: 'checklist' });

/**
 * USER ↔ MAINTENANCE SCHEDULES
 * One user can be assigned many maintenance tasks
 * One schedule is assigned to one user
 */
User.hasMany(MaintenanceSchedule, { foreignKey: 'userId', as: 'schedules' });
MaintenanceSchedule.belongsTo(User, { foreignKey: 'userId', as: 'user' });

/**
 * EQUIPMENT ↔ MAINTENANCE SCHEDULES
 * One equipment can have many scheduled maintenance tasks
 * One schedule is for one equipment
 */
Equipment.hasMany(MaintenanceSchedule, { foreignKey: 'equipId', as: 'schedules' });
MaintenanceSchedule.belongsTo(Equipment, { foreignKey: 'equipId', as: 'equipment' });

/**
 * USER ↔ EQUIPMENT HEALTH
 * One user can track health of many equipment
 * One health record belongs to one user
 */
User.hasMany(EquipmentHealth, { foreignKey: 'userId', as: 'equipmentHealth' });
EquipmentHealth.belongsTo(User, { foreignKey: 'userId', as: 'user' });

/**
 * EQUIPMENT ↔ EQUIPMENT HEALTH (One-to-One)
 * One equipment has exactly one health record
 * One health record describes one equipment
 */
Equipment.hasOne(EquipmentHealth, { foreignKey: 'equipId', as: 'health' });
EquipmentHealth.belongsTo(Equipment, { foreignKey: 'equipId', as: 'equipment' });

// ─────────────────────────────────────────────────────────────────────────
// MODULE EXPORTS
// ─────────────────────────────────────────────────────────────────────────
// Export all models for use in routes and services
module.exports = {
  User,
  Equipment,
  Work,
  Alert,
  AuditLog,
  Checklist,
  ChecklistCompletion,
  MaintenanceSchedule,
  EquipmentHealth,
  WorkAttachment,
};
