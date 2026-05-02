// controllers/assistantController.js
// Rewrite / Analyze / Improve endpoints

import HistoryEntry from "../models/HistoryEntry.js";
import { rewriteText, analyzeText, improveText } from "../services/aiService.js";

const validTones = ["formal", "informal", "casual", "professional", "humorous"];

/**
 * POST /api/rewrite
 * Body: { original_text: string, tone: string }
 */
const rewrite = async (req, res) => {
  try {
    const { original_text, tone } = req.body;

    if (!original_text || String(original_text).trim().length < 2) {
      return res.status(400).json({ error: "'original_text' is required." });
    }

    if (!tone || !validTones.includes(tone)) {
      return res.status(400).json({ error: `Tone must be one of: ${validTones.join(", ")}` });
    }

    const rewritten = await rewriteText(String(original_text).trim(), tone);

    // Best-effort save to history (as general)
    try {
      await HistoryEntry.create({
        userId: req.user._id,
        prompt: String(original_text).trim(),
        output: rewritten,
        tone,
        contentType: "general",
      });
    } catch (err) {
      console.error("History save error (rewrite):", err.message);
    }

    return res.status(200).json({ output: rewritten, tone });
  } catch (error) {
    console.error("Rewrite error:", error.message);
    if (error.message.startsWith("AI generation failed:")) {
      return res.status(502).json({ error: error.message });
    }
    return res.status(500).json({ error: "Rewrite failed. Please try again." });
  }
};

/**
 * POST /api/analyze
 * Body: { text: string }
 */
const analyze = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || String(text).trim().length < 2) {
      return res.status(400).json({ error: "'text' is required." });
    }

    const analysis = await analyzeText(String(text).trim());

    // light validation / shaping
    const result = {
      professionalism: Number(analysis?.professionalism),
      clarity: Number(analysis?.clarity),
      tone: typeof analysis?.tone === "string" ? analysis.tone : "",
      suggestions: Array.isArray(analysis?.suggestions) ? analysis.suggestions.slice(0, 2) : [],
    };

    if (Number.isNaN(result.professionalism) || Number.isNaN(result.clarity)) {
      return res.status(502).json({ error: "Analysis returned invalid scores." });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Analyze error:", error.message);
    return res.status(500).json({ error: error.message || "Analyze failed. Please try again." });
  }
};

/**
 * POST /api/improve
 * Body: { original_text: string, suggestions: string[] }
 */
const improve = async (req, res) => {
  try {
    const { original_text, suggestions } = req.body;

    if (!original_text || String(original_text).trim().length < 2) {
      return res.status(400).json({ error: "'original_text' is required." });
    }

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      return res.status(400).json({ error: "'suggestions' must be a non-empty array." });
    }

    const improved = await improveText(String(original_text).trim(), suggestions);

    // Best-effort save to history (as general)
    try {
      await HistoryEntry.create({
        userId: req.user._id,
        prompt: String(original_text).trim(),
        output: improved,
        tone: "professional",
        contentType: "general",
      });
    } catch (err) {
      console.error("History save error (improve):", err.message);
    }

    return res.status(200).json({ output: improved });
  } catch (error) {
    console.error("Improve error:", error.message);
    return res.status(500).json({ error: "Improve failed. Please try again." });
  }
};

export { rewrite, analyze, improve };
