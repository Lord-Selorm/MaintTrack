/**
 * ═══════════════════════════════════════════════════════════════════════════
 * USER MODEL
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Represents user accounts in the system
 * 
 * Fields:
 * - id: Unique identifier (auto-incremented)
 * - email: User's email address (unique, used for login)
 * - password: Hashed password (bcrypt with salt)
 * - name: User's full name
 * - role: User's role (admin, manager, technician, viewer)
 * - department: User's department (optional)
 * - phone: User's phone number (optional)
 * - isActive: Account status (true = active, false = disabled)
 * - createdAt: Account creation timestamp
 * 
 * Security:
 * - Passwords are hashed before storage using bcrypt
 * - Salt factor: 10 rounds
 * - Password hashing happens on create and update
 * - comparePassword() method for login validation
 * 
 * Features:
 * - Email validation (must be valid email format)
 * - Password validation (minimum 6 characters)
 * - Unique email constraint
 * - Automatic lowercasing and trimming of email
 * - Role validation (restricted to 4 allowed values)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../db');

/**
 * User Model Definition
 * Defines the structure and behavior of user records
 */
const User = sequelize.define('User', {
  // Primary key
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  
  // Email (login identifier)
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,              // Prevents duplicate email addresses
    lowercase: true,           // Converts to lowercase on save
    trim: true,               // Removes whitespace
    validate: {
      isEmail: true,          // Validates email format
    },
  },
  
  // Password (stored as hash)
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 255],         // Password must be 6-255 characters
    },
  },
  
  // User's display name
  name: {
    type: DataTypes.STRING,
    trim: true,
  },
  
  // User's role (determines permissions)
  role: {
    type: DataTypes.STRING,
    defaultValue: 'technician',
    validate: {
      isIn: [['admin', 'technician', 'manager', 'viewer']],  // Restrict to 4 roles
    },
  },
  
  // User's department (optional)
  department: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  
  // User's phone number (optional)
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  
  // Account active status
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,       // New accounts are active by default
  },
  
  // Account creation timestamp
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false,          // Use manual createdAt, no updatedAt
  tableName: 'users',        // Explicitly set table name
});

/**
 * PASSWORD HASHING - BEFORE CREATE
 * Automatically hashes password before saving new user
 * 
 * Process:
 * 1. Generate salt with 10 rounds
 * 2. Hash password using salt
 * 3. Replace plaintext password with hash
 * 
 * Trigger: User.create() or sequelize.sync()
 */
User.beforeCreate(async (user) => {
  const salt = await bcrypt.genSalt(10);           // Generate salt
  user.password = await bcrypt.hash(user.password, salt);  // Hash password
});

/**
 * PASSWORD HASHING - BEFORE UPDATE
 * Only re-hashes password if it was actually changed
 * Prevents unnecessary hashing when other fields update
 * 
 * Trigger: user.update() when password field changes
 */
User.beforeUpdate(async (user) => {
  if (user.changed('password')) {                  // Only if password changed
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

/**
 * PASSWORD COMPARISON METHOD
 * Validates plaintext password against stored hash
 * Used during login to verify credentials
 * 
 * @param {string} candidatePassword - Plaintext password to check
 * @returns {Promise<boolean>} - True if password matches, false otherwise
 * 
 * Usage: const isValid = await user.comparePassword(inputPassword)
 */
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;
