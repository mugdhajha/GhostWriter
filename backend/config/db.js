// config/db.js
// Handles MongoDB connection using Mongoose

import mongoose from "mongoose";

let retryTimer = null;

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error(
        "❌ MongoDB connection error: MONGO_URI is not set. Add it to backend/.env"
      );
      return false;
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);

    // Keep the server process alive so routes can return a clear 503 instead of crashing.
    const retryMs = Number(process.env.MONGO_RETRY_MS || 5000);
    if (!retryTimer) {
      console.error(`↻ Retrying MongoDB connection in ${retryMs}ms...`);
      retryTimer = setTimeout(() => {
        retryTimer = null;
        connectDB();
      }, retryMs);
    }

    return false;
  }
};

export default connectDB;
