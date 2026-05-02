// routes/authRoutes.js

import express from "express";
import { signup, login } from "../controllers/authController.js";
import requireDb from "../middleware/requireDb.js";

const router = express.Router();

router.use(requireDb);

// POST /api/auth/signup
router.post("/signup", signup);

// POST /api/auth/login
router.post("/login", login);

export default router;
