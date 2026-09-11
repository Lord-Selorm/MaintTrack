require('dotenv').config();

const app = require('./app');
const sequelize = require('./db');
const { runMigrations } = require('./migrate');
const { seed } = require('./seed');

async function bootstrap() {
  await sequelize.authenticate();
  console.log('SQLite database connected');

  // Destructive sync requires explicit opt-in.
  const forceSync = process.env.FORCE_SYNC === 'true' && process.env.CONFIRM_FORCE_SYNC === 'yes';
  if (process.env.FORCE_SYNC === 'true' && !forceSync) {
    console.warn('FORCE_SYNC requested but CONFIRM_FORCE_SYNC !== "yes" — skipping destructive sync');
  }
  if (forceSync) {
    console.warn('Force sync enabled: existing tables will be dropped and recreated');
  }

  // Sync builds the schema first so migrations apply cleanly on existing tables.
  await sequelize.sync({ force: forceSync });
  console.log('Database schema synced');

  await runMigrations();
  console.log('Migrations applied');

  // Non-destructive seed: ensures the admin user and sample data exist.
  await seed({ sync: false });
  console.log('Seeding complete');

  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`MaintTrack API listening on port ${port}`));
}

bootstrap().catch((err) => {
  console.error('Startup failed:', err);
  process.exit(1);
});