const mongoose = require('mongoose');

/**
 * Connect to MongoDB using the URI in the environment.
 * Kept separate from the Express app so the app module can be
 * imported (e.g. for tests) without opening a database connection.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not defined in the environment');
  }

  // Strict query keeps Mongoose from silently ignoring unknown fields.
  mongoose.set('strictQuery', true);

  const conn = await mongoose.connect(uri);
  console.log(`MongoDB connected: ${conn.connection.host}`);
  return conn;
};

module.exports = connectDB;
