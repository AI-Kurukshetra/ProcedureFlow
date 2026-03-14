require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { connectDB, sequelize } = require('../config/database');

async function migrate() {
  try {
    await connectDB();
    await sequelize.sync({ alter: true });
    console.log('Database migration complete.');
    process.exit(0);
  } catch (error) {
    console.error('Database migration failed:', error);
    process.exit(1);
  }
}

migrate();
