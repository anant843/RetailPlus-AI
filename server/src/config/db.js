const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  const mongoUri = process.env.MONGO_URI;

  if (mongoUri) {
    try {
      const conn = await mongoose.connect(mongoUri, { dbName: 'retailpulse' });
      isConnected = true;
      console.log(`✅ MongoDB Connected to Atlas: ${conn.connection.host}`);
      console.log(`📁 Database Name: ${conn.connection.name}`);

      // Auto-seed Atlas database if empty
      try {
        const { seedDatabase } = require('../seeds/seedData');
        await seedDatabase();
      } catch (seedErr) {
        console.log('ℹ️  Atlas seed status:', seedErr.message);
      }

      return;
    } catch (err) {
      console.warn(`⚠️  MongoDB connection failed: ${err.message}`);
      console.log('🔄 Falling back to in-memory MongoDB...');
    }
  } else {
    console.log('ℹ️  No MONGO_URI set. Using in-memory MongoDB for demo...');
  }

  // Fallback: in-memory MongoDB
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    isConnected = true;
    console.log('✅ In-memory MongoDB started successfully');
    console.log('💡 Data will reset on server restart. Set MONGO_URI in .env for persistence.');

    // Seed data after connection
    setTimeout(async () => {
      try {
        const { seedDatabase } = require('../seeds/seedData');
        await seedDatabase();
      } catch (e) {
        console.log('ℹ️  Seed skipped:', e.message);
      }
    }, 500);

  } catch (err) {
    console.error('❌ In-memory MongoDB failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
