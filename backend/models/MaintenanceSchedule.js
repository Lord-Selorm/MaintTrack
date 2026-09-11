const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const MaintenanceSchedule = sequelize.define('MaintenanceSchedule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  equipId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  scheduledDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  maintenanceType: {
    type: DataTypes.STRING,
    validate: {
      isIn: [['Maintenance', 'Repair', 'Inspection', 'Preventive']],
    },
  },
  priority: {
    type: DataTypes.STRING,
    defaultValue: 'Normal',
    validate: {
      isIn: [['Low', 'Normal', 'High', 'Critical']],
    },
  },
  assignedTo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Assigned technician user ID',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  estimatedCost: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Scheduled',
    validate: {
      isIn: [['Scheduled', 'In Progress', 'Completed', 'Postponed', 'Cancelled']],
    },
  },
  completedDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false,
  tableName: 'maintenance_schedules',
});

module.exports = MaintenanceSchedule;
