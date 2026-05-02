// routes/aiRoutes.js

import express from "express";
import { generate } from "../controllers/aiController.js";
import protect from "../middleware/authMiddleware.js";
import requireDb from "../middleware/requireDb.js";

const router = express.Router();

// POST /api/ai/generate — protected route
router.post("/generate", protect, requireDb, generate);

export default router;
