require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');

const config = require('./config');
// Initialize models and associations before any route module is loaded
require('./models');

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────
// Same-service frontend is served by this server; keep local dev origins open.
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (process.env.NODE_ENV === 'production') return cb(null, true);
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
    return cb(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsing (50MB limit for file uploads) ───────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ── Security headers ─────────────────────────────────────────────────────
// CSP allows the external CDN resources used by the frontend.
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy',
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://fonts.googleapis.com https://*.render.com; " +
    "img-src 'self' data: blob: https:; " +
    "font-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://fonts.gstatic.com;"
  );
  next();
});

// ── Static frontend (same-origin single-page app) ────────────────────────
app.use(express.static(config.frontendDir));
app.get('/', (req, res) => res.sendFile(path.join(config.frontendDir, 'index.html')));

// ── Health check ─────────────────────────────────────────────────────────
app.get('/api/health-check', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date(), uptime: process.uptime() });
});

// ── API routes ───────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/work', require('./routes/work'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/checklists', require('./routes/checklists'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/health', require('./routes/health'));
app.use('/api/import', require('./routes/imports'));
app.use('/api/users', require('./routes/users'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/backup', require('./routes/backup'));

// ── Unknown API routes ───────────────────────────────────────────────────
app.use('/api/', (req, res) => res.status(404).json({ error: 'Not found' }));

// ── Error handling (must be registered last) ─────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;