/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DATABASE CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Initializes and configures the SQLite database connection
 * 
 * Database: SQLite3 (lightweight, file-based, perfect for small to medium apps)
 * File Location: maintenance_tracker.db (in backend directory)
 * ORM: Sequelize (provides data modeling and query building)
 * 
 * Configuration:
 * - Dialect: sqlite (SQL database format)
 * - Storage: File path to maintenance_tracker.db
 * - Logging: Disabled by default (enable for debugging SQL queries)
 * - Timestamps: Handled by models (createdAt, updatedAt)
 * 
 * Usage:
 * - Import this module in models to establish ORM connection
 * - Use sequelize.authenticate() to test connection
 * - Use sequelize.sync() to create/update tables
 * - Use sequelize.query() for raw SQL queries
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { Sequelize } = require('sequelize');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────
// SEQUELIZE INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────
// Creates SQLite database connection
// storage: Specifies where the database file will be saved
// logging: Set to console.log to see all SQL queries for debugging
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'maintenance_tracker.db'),
  logging: false,  // Change to console.log for debugging SQL queries
});

module.exports = sequelize;
