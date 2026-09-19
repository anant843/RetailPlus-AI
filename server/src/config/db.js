const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(mongoUri, {
      dbName: 'retailpulse',
    });

    isConnected = true;

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📁 Database: ${conn.connection.name}`);

    // Auto Seed
    try {
      const { seedDatabase } = require('../seeds/seedData');
      await seedDatabase();
    } catch (seedErr) {
      console.log('ℹ️ Seed status:', seedErr.message);
    }

  } catch (err) {
    console.error('❌ MongoDB Connection Failed');
    console.error(err.message);

    process.exit(1);
  }
};

module.exports = connectDB;