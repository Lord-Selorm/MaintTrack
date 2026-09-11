const path = require('path');

const srcDir = __dirname;

module.exports = {
  rootDir: path.join(srcDir, '..'),
  frontendDir: path.join(srcDir, '..', '..', 'frontend'),
  uploadsDir: path.join(srcDir, '..', 'uploads'),
  dbPath: path.join(srcDir, '..', 'maintenance_tracker.db'),
  seedInfoPath: path.join(srcDir, '..', 'seed-info.json'),
};