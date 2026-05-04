// routes/assistantRoutes.js

import express from "express";
import protect from "../middleware/authMiddleware.js";
import requireDb from "../middleware/requireDb.js";
import { rewrite, analyze, improve } from "../controllers/assistantController.js";
import { getHistory, getThreadHistory, deleteHistory } from "../controllers/historyController.js";

const router = express.Router();

// All assistant routes are protected
router.use(protect);

router.post("/rewrite", rewrite);
router.post("/analyze", analyze);
router.post("/improve", improve);

router.get("/history", requireDb, getHistory);
router.get("/history/thread/:threadId", requireDb, getThreadHistory);
router.delete("/history/:id", requireDb, deleteHistory);

export default router;
