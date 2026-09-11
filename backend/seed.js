require('dotenv').config();
const sequelize = require('./db');
require('./models');
const { User, Equipment, Work } = require('./models');
const fs = require('fs');
const path = require('path');

async function seed(options = { sync: true }) {
  try {
    if (options.sync) {
      await sequelize.authenticate();
      await sequelize.sync();
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    let user = await User.findOne({ where: { email: adminEmail } });
    if (!user) {
      user = await User.create({
        email: adminEmail,
        password: adminPassword,
        name: 'Administrator',
        role: 'admin',
        isActive: true,
      });
      console.log('Created admin user:', adminEmail);
      console.log('Admin password:', adminPassword);
    } else {
      console.log('Admin user already exists:', adminEmail);
    }

    // Save seed info to file for UI display (development only)
    try {
      const info = { adminEmail, adminPassword };
      fs.writeFileSync(path.join(__dirname, 'seed-info.json'), JSON.stringify(info, null, 2));
      console.log('Wrote seed info to seed-info.json');
    } catch (e) {
      console.warn('Failed to write seed-info.json', e);
    }

    // Seed sample equipment and work records if none exist
    const equipmentCount = await Equipment.count();
    if (equipmentCount === 0) {
      const now = new Date();
      const sampleEquip = await Equipment.bulkCreate([
        {
          name: 'Main Generator',
          serial: 'GEN-0001',
          type: 'Generator',
          status: 'Active',
          installed: now,
          lifespan: 15,
          location: 'Plant Room',
          notes: 'Primary backup generator',
          userId: user.id,
        },
        {
          name: 'AC Unit - Office',
          serial: 'AC-1001',
          type: 'AC Unit',
          status: 'Active',
          installed: now,
          lifespan: 10,
          location: '2nd Floor',
          notes: 'Routine maintenance quarterly',
          userId: user.id,
        }
      ]);

      console.log('Seeded sample equipment:', sampleEquip.map(e => e.serial));

      // Create sample work records for first equipment
      const workSamples = [
        {
          equipId: sampleEquip[0].id,
          type: 'Maintenance',
          date: now,
          tech: 'Tech A',
          dur: 120,
          cost: 150.00,
          desc: 'Full generator inspection and oil change',
          userId: user.id,
        },
        {
          equipId: sampleEquip[1].id,
          type: 'Inspection',
          date: now,
          tech: 'Tech B',
          dur: 60,
          cost: 0.00,
          desc: 'AC filter check and cleaning',
          userId: user.id,
        }
      ];

      await Work.bulkCreate(workSamples);
      console.log('Seeded sample work records');
    } else {
      console.log('Equipment already present — skipping equipment/work seeding');
    }

    return { createdAdmin: !!user, adminEmail, adminPassword };
  } catch (err) {
    console.error('Seeding error:', err);
    throw err;
  }
}

if (require.main === module) {
  seed({ sync: true }).then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { seed };
