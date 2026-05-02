import mongoose from "mongoose";

const requireDb = (req, res, next) => {
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (mongoose.connection.readyState === 1) return next();

  return res.status(503).json({
    error:
      "Database unavailable. Start MongoDB (or set MONGO_URI) and try again.",
  });
};

export default requireDb;
