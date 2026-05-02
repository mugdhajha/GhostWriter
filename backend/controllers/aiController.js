// controllers/aiController.js
// Handles AI generation requests — thin controller, logic lives in aiService

import { generateReply } from "../services/aiService.js";

/**
 * POST /api/ai/generate
 * Generates an AI reply that mimics the user's writing style
 * Body: { message: string, tone: string }
 */
const generate = async (req, res) => {
  try {
    const { message, tone } = req.body;

    // Validate inputs
    if (!message || !tone) {
      return res.status(400).json({ error: "Both 'message' and 'tone' are required." });
    }

    if (message.trim().length < 2) {
      return res.status(400).json({ error: "Message is too short." });
    }

    const validTones = ["formal", "informal", "casual", "professional", "humorous"];
    if (!validTones.includes(tone)) {
      return res.status(400).json({ error: `Tone must be one of: ${validTones.join(", ")}` });
    }

    // Delegate to service layer
    const reply = await generateReply(req.user._id, message.trim(), tone);

    res.status(200).json({
      reply,
      tone,
    });
  } catch (error) {
    console.error("AI generate error:", error.message);

    // Return user-friendly error messages
    if (error.message.includes("No writing samples")) {
      return res.status(400).json({ error: error.message });
    }

    if (error.message.includes("GEMINI_API_KEY")) {
      return res.status(500).json({ error: error.message });
    }

    if (error.message.startsWith("AI generation failed:")) {
      // Bubble up the provider error message (no stack trace) to help debugging.
      return res.status(502).json({ error: error.message });
    }

    res.status(500).json({ error: "AI generation failed. Please try again." });
  }
};

export { generate };
