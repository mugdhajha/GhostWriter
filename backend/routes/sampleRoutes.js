// routes/sampleRoutes.js

import express from "express";
import { addSample, getSamples, deleteSample } from "../controllers/sampleController.js";
import protect from "../middleware/authMiddleware.js";
import requireDb from "../middleware/requireDb.js";

const router = express.Router();

// All sample routes are protected
router.use(protect);
router.use(requireDb);

// POST /api/samples/add
router.post("/add", addSample);

// GET /api/samples
router.get("/", getSamples);

// DELETE /api/samples/:id
router.delete("/:id", deleteSample);

export default router;
