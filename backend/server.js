// server.js
// GhostWriter++ Backend — Entry Point

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import sampleRoutes from "./routes/sampleRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients (curl/Postman) that don't send Origin.
      if (!origin) return callback(null, true);

      const isLocalDevOrigin =
        /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

      if (isLocalDevOrigin) return callback(null, true);
      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/", (req, res) => {
  res.json({ message: "GhostWriter++ API is running ✅", version: "1.0.0" });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/samples", sampleRoutes);
app.use("/api/ai", aiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({ error: "An unexpected server error occurred." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 GhostWriter++ server running on port ${PORT}`);
});
