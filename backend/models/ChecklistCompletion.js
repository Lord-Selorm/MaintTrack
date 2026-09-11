const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const ChecklistCompletion = sequelize.define('ChecklistCompletion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  checklistId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  equipId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  workId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Related work record',
  },
  completedItems: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Array of completed checklist items with timestamps and notes',
  },
  itemsCompleted: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  totalItems: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  completionPercentage: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  issuesFound: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of issues identified during inspection',
  },
  recommendedActions: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  completedBy: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Technician name',
  },
  completedDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  photoUrls: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of photo URLs from inspection',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: false,
  tableName: 'checklist_completions',
});

module.exports = ChecklistCompletion;
