/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EQUIPMENT MAINTENANCE TRACKER - BACKEND SERVER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Express.js REST API server for the Maintenance Tracker application
 * 
 * Handles:
 * - User authentication and role-based access control (RBAC)
 * - Equipment management (CRUD operations)
 * - Work logging and maintenance tracking
 * - Alert generation and management
 * - Analytics and reporting
 * - Checklist management for inspections
 * - Maintenance scheduling
 * - Equipment health scoring
 * - Document imports/exports
 * 
 * Port: 5000 (default, configurable via PORT env var)
 * Database: SQLite (maintenance_tracker.db)
 * 
 * Features:
 * ✓ CORS enabled for frontend access
 * ✓ JWT-based authentication
 * ✓ Role-based permission system (Admin, Manager, Technician, Viewer)
 * ✓ Comprehensive error handling
 * ✓ Database auto-sync on startup
 * 
 * Middleware Stack:
 * 1. CORS (Cross-Origin Resource Sharing)
 * 2. JSON body parser (max 50MB for file uploads)
 * 3. Security headers
 * 4. Authentication (on protected routes)
 * 5. RBAC middleware (for permission-based access)
 * 6. Error handling
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const sequelize = require('./db');
const cors = require('cors');
require('dotenv').config();

// Initialize all database models and their associations
// This must be called before any route that uses the models
require('./models');
// Optional seeding utility
const { seed } = require('./seed');

const app = express();

// ─────────────────────────────────────────────────────────────────────────
// CORS CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────
// Allows requests from frontend application (localhost:3000, file:// protocol)
// Credentials enabled for cookie/session support if needed
app.use(cors({
  origin: ['http://localhost:5000', 'http://localhost:8000', 'http://127.0.0.1:8000', 'http://localhost:3000', 'file://'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


// ─────────────────────────────────────────────────────────────────────────
// BODY PARSER MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────
// Parses incoming JSON requests (up to 50MB for file uploads)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ─────────────────────────────────────────────────────────────────────────
// SECURITY HEADERS
// ─────────────────────────────────────────────────────────────────────────
// Adds security headers to all responses
// CSP policy allows local scripts and external CDN resources
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* https://cdnjs.cloudflare.com https://cdn.jsdelivr.net");
  next();
});

// ─────────────────────────────────────────────────────────────────────────
// STATIC FILE SERVING (FRONTEND)
// ─────────────────────────────────────────────────────────────────────────
const path = require('path');
app.use(express.static(path.join(__dirname, '..')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'maintenance_tracker.html')));

// ─────────────────────────────────────────────────────────────────────────
// DATABASE CONNECTION AND SYNCHRONIZATION
// ─────────────────────────────────────────────────────────────────────────
// Establishes connection to SQLite database
// Syncs database schema with defined models (creates/updates tables)
sequelize.authenticate().then(async () => {
  console.log('SQLite database connected');
  // Apply lightweight migrations (adds new columns to existing tables in place)
  require('./models');
  const { runMigrations } = require('./migrate');
  await runMigrations().catch(err => console.log('Migration error:', err));
  // By default do not force-sync (preserve existing data).
  // To avoid accidental data loss, FORCE_SYNC requires explicit confirmation.
  // Set FORCE_SYNC=true AND CONFIRM_FORCE_SYNC=yes to enable destructive sync.
  let forceSync = false;
  if (process.env.FORCE_SYNC === 'true') {
    if (process.env.CONFIRM_FORCE_SYNC === 'yes') {
      forceSync = true;
      console.warn('Force sync enabled: existing tables will be dropped and recreated');
    } else {
      console.warn('FORCE_SYNC requested but CONFIRM_FORCE_SYNC !== "yes" — skipping destructive sync');
    }
  }

  sequelize.sync({ force: forceSync }).then(() => {
    console.log('Database synced');
    // Run seed (non-destructive) after sync to ensure admin user and sample data exist
    seed({ sync: false }).then(() => console.log('Seeding complete')).catch(err => console.log('Seed error:', err));
  }).catch(err => console.log('Sync error:', err));
}).catch(err => {
  console.log('SQLite connection error:', err);
});

// ─────────────────────────────────────────────────────────────────────────
// ROUTE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────
// Import all route modules for different features
const equipmentRoutes = require('./routes/equipment');    // Equipment CRUD
const workRoutes = require('./routes/work');              // Work log operations
const authRoutes = require('./routes/auth');              // Authentication & registration
const reportRoutes = require('./routes/reports');         // Report generation
const alertRoutes = require('./routes/alerts');           // Alert management
const analyticsRoutes = require('./routes/analytics');    // Analytics & statistics
const importRoutes = require('./routes/imports');         // Import/export functionality
const checklistRoutes = require('./routes/checklists');   // Checklist management
const scheduleRoutes = require('./routes/schedules');     // Maintenance scheduling
const healthRoutes = require('./routes/health');          // Equipment health scoring
const userRoutes = require('./routes/users');             // User management (admin)
const auditRoutes = require('./routes/audit');            // Audit log viewing (admin)
const backupRoutes = require('./routes/backup');          // Master backup export

// ─────────────────────────────────────────────────────────────────────────
// ROUTE REGISTRATION
// ─────────────────────────────────────────────────────────────────────────
// Register all route handlers under their respective API paths
app.use('/api/auth', authRoutes);                         // /api/auth/register, /api/auth/login
app.use('/api/equipment', equipmentRoutes);               // /api/equipment/*
app.use('/api/work', workRoutes);                         // /api/work/*
app.use('/api/reports', reportRoutes);                    // /api/reports/*
app.use('/api/alerts', alertRoutes);                      // /api/alerts/*
app.use('/api/analytics', analyticsRoutes);               // /api/analytics/*
app.use('/api/checklists', checklistRoutes);              // /api/checklists/*
app.use('/api/schedules', scheduleRoutes);                // /api/schedules/*
app.use('/api/health', healthRoutes);                     // /api/health/*
app.use('/api/import', importRoutes);                     // /api/import/*
app.use('/api/users', userRoutes);                        // /api/users/* (admin)
app.use('/api/audit', auditRoutes);                       // /api/audit/* (admin)
app.use('/api/backup', backupRoutes);                     // /api/backup/* (admin)

// ─────────────────────────────────────────────────────────────────────────
// ERROR HANDLING MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────
// Catches all unhandled errors in route handlers
// Must be last middleware in the stack
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ─────────────────────────────────────────────────────────────────────────
// HEALTH CHECK ENDPOINT
// ─────────────────────────────────────────────────────────────────────────
// Simple endpoint to verify server is running
// Returns JSON with status and timestamp
app.get('/api/health-check', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date(), uptime: process.uptime() });
});

// ─────────────────────────────────────────────────────────────────────────
// SERVER STARTUP
// ─────────────────────────────────────────────────────────────────────────
// Starts the Express server on configured port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║   Equipment Maintenance Tracker Backend Server             ║
║   Running on port ${PORT}                                     ║
║   Database: SQLite (maintenance_tracker.db)                ║
║   Time: ${new Date().toLocaleString()}                 ║
╚════════════════════════════════════════════════════════════╝
  `);
});
