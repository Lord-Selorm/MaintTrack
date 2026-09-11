const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Equipment = sequelize.define('Equipment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    trim: true,
  },
  serial: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    trim: true,
  },
  type: {
    type: DataTypes.ENUM('AC Unit', 'Generator', 'Elevator', 'HVAC', 'Pump', 'Compressor', 'Vehicle', 'Other'),
    defaultValue: 'Other',
  },
  status: {
    type: DataTypes.ENUM('Active', 'Under Repair', 'Inactive'),
    defaultValue: 'Active',
  },
  installed: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  lifespan: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
    validate: {
      min: 1,
      max: 50,
    },
  },
  location: {
    type: DataTypes.STRING,
    trim: true,
  },
  notes: {
    type: DataTypes.TEXT,
    trim: true,
  },
  manualPath: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Path to equipment manual/documentation file',
  },
  manualFileName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Original filename of the manual',
  },
  purchasePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Equipment purchase price for depreciation',
  },
  warrantyExpiration: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Warranty expiration date',
  },
  warrantyTerms: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Warranty terms (1yr, 3yr, 5yr, Lifetime)',
  },
  isFavorite: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  qrCode: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'QR code SVG/URL for equipment',
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false,
  tableName: 'equipment',
  hooks: {
    beforeUpdate: (equipment) => {
      equipment.updatedAt = new Date();
    },
  },
});

module.exports = Equipment;
