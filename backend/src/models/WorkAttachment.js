const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const WorkAttachment = sequelize.define('WorkAttachment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  workId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fileType: {
    type: DataTypes.ENUM('IMAGE', 'VIDEO', 'PDF', 'DOCUMENT'),
    defaultValue: 'IMAGE',
  },
  thumbnailPath: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  uploadedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false,
  tableName: 'work_attachments',
});

module.exports = WorkAttachment;
