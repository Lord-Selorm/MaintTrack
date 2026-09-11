const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const EquipmentHealth = sequelize.define('EquipmentHealth', {
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
    unique: true,
  },
  healthScore: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    validate: {
      min: 0,
      max: 100,
    },
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Healthy',
    validate: {
      isIn: [['Excellent', 'Healthy', 'Fair', 'Poor', 'Critical', 'Offline']],
    },
  },
  agePercentage: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  maintenanceOverdueHours: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  failureRiskLevel: {
    type: DataTypes.STRING,
    defaultValue: 'Low',
    validate: {
      isIn: [['Low', 'Medium', 'High', 'Critical']],
    },
  },
  recommendedAction: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  nextScheduledMaintenance: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lastCheckedDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false,
  tableName: 'equipment_health',
});

module.exports = EquipmentHealth;
