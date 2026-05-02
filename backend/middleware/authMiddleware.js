// middleware/authMiddleware.js
// Verifies JWT token and attaches user to request

import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Not authorized. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    const secret = process.env.JWT_SECRET;
    if (
      !secret ||
      secret.trim() === "" ||
      secret.includes("change_this_in_production") ||
      secret.includes("your_super_secret")
    ) {
      return res.status(500).json({
        error:
          "Server auth misconfigured: JWT_SECRET is not set. Set it in backend/.env and restart the backend.",
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, secret);

    // Attach user to request (excluding password)
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ error: "User not found." });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token." });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired. Please log in again." });
    }
    return res.status(500).json({ error: "Server error during authentication." });
  }
};

export default protect;
