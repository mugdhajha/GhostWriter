// routes/aiRoutes.js

import express from "express";
import { generate } from "../controllers/aiController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/ai/generate — protected route
router.post("/generate", protect, generate);

export default router;
