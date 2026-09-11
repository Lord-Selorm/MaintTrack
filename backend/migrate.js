/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LIGHTWEIGHT SQLITE MIGRATIONS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Sequelize sync({ force: false }) creates missing tables but does NOT add
 * new columns to already-existing tables. This module inspects the live SQLite
 * schema and applies `ALTER TABLE ... ADD COLUMN` for new fields so existing
 * databases upgrade in place without destructive re-sync.
 *
 * Usage (from server.js after authenticate, before sync):
 *   await runMigrations();
 * ═══════════════════════════════════════════════════════════════════════════
 */
const sequelize = require('./db');

const migrations = [
  {
    table: 'work',
    column: 'approvalStatus',
    definition: `VARCHAR(255) NOT NULL DEFAULT 'Pending'`,
  },
  {
    table: 'work',
    column: 'approvedBy',
    definition: 'INTEGER',
  },
  {
    table: 'work',
    column: 'approvedAt',
    definition: 'DATETIME',
  },
];

const renames = [
  {
    table: 'checklist_completions',
    from: 'issuelsFound',
    to: 'issuesFound',
  },
];

async function columnExists(table, column) {
  const [rows] = await sequelize.query(`PRAGMA table_info(${table})`);
  return rows.some(r => r.name === column);
}

async function runMigrations() {
  for (const m of migrations) {
    try {
      if (await columnExists(m.table, m.column)) continue;
      await sequelize.query(`ALTER TABLE ${m.table} ADD COLUMN ${m.column} ${m.definition}`);
      console.log(`Migration applied: ${m.table}.${m.column}`);
    } catch (err) {
      console.log(`Migration skipped (${m.table}.${m.column}):`, err.message);
    }
  }

  for (const r of renames) {
    try {
      const hasFrom = await columnExists(r.table, r.from);
      const hasTo = await columnExists(r.table, r.to);
      if (hasFrom && !hasTo) {
        await sequelize.query(`ALTER TABLE ${r.table} RENAME COLUMN ${r.from} TO ${r.to}`);
        console.log(`Column renamed: ${r.table}.${r.from} -> ${r.to}`);
      }
    } catch (err) {
      console.log(`Rename skipped (${r.table}.${r.from}):`, err.message);
    }
  }

  // Rebuild audit_logs once so NULL userId/entityId are allowed
  if (await columnExists('audit_logs', 'userId')) {
    const [cols] = await sequelize.query('PRAGMA table_info(audit_logs)');
    const userIdCol = cols.find(c => c.name === 'userId');
    if (userIdCol && userIdCol.notnull) {
      try {
        await sequelize.query('ALTER TABLE audit_logs RENAME TO audit_logs_old');
        await sequelize.query(`CREATE TABLE audit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER,
          action TEXT NOT NULL,
          entityType TEXT NOT NULL,
          entityId INTEGER,
          changes JSON,
          oldValues JSON,
          newValues JSON,
          ipAddress VARCHAR(255),
          userAgent TEXT,
          createdAt DATETIME
        )`);
        await sequelize.query(`INSERT INTO audit_logs (id, userId, action, entityType, entityId, changes, oldValues, newValues, ipAddress, userAgent, createdAt)
          SELECT id, userId, action, entityType, entityId, changes, oldValues, newValues, ipAddress, userAgent, createdAt FROM audit_logs_old`);
        await sequelize.query('DROP TABLE audit_logs_old');
        console.log('Migration applied: audit_logs rebuilt (nullable userId/entityId)');
      } catch (err) {
        console.log('Migration skipped (audit_logs rebuild):', err.message);
      }
    } else {
      console.log('Migration skipped (audit_logs already nullable)');
    }
  }
}

module.exports = { runMigrations, migrations };