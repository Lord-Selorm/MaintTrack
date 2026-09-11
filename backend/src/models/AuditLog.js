const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  action: {
    type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGIN_FAILED', 'REGISTER', 'APPROVE', 'REJECT', 'BACKUP'),
    allowNull: false,
  },
  entityType: {
    type: DataTypes.ENUM('EQUIPMENT', 'WORK', 'USER', 'AUTH', 'SCHEDULE', 'CHECKLIST', 'HEALTH', 'BACKUP'),
    allowNull: false,
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  changes: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'JSON object showing before/after values',
  },
  oldValues: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  newValues: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false,
  tableName: 'audit_logs',
});

module.exports = AuditLog;
