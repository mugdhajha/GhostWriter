// controllers/authController.js
// Handles user signup and login

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Generates a JWT token for the given user ID
 */
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (
    !secret ||
    secret.trim() === "" ||
    secret.includes("change_this_in_production") ||
    secret.includes("your_super_secret")
  ) {
    throw new Error(
      "JWT_SECRET is not set (or still using the placeholder). Set it in backend/.env and restart the backend."
    );
  }

  return jwt.sign({ id }, secret, { expiresIn: "7d" });
};

/**
 * POST /api/auth/signup
 * Creates a new user account
 */
const signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the user
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    // Return token and user info
    const token = generateToken(user._id);

    res.status(201).json({
      message: "Account created successfully.",
      token,
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    res.status(500).json({ error: "Server error during signup. Please try again." });
  }
};

/**
 * POST /api/auth/login
 * Authenticates a user and returns a JWT token
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    // Find the user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Generate and return token
    const token = generateToken(user._id);

    res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ error: "Server error during login. Please try again." });
  }
};

export { signup, login };
