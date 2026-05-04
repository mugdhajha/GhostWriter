// controllers/aiController.js
// Handles AI generation requests — thin controller, logic lives in aiService

import { generateReply } from "../services/aiService.js";
import HistoryEntry from "../models/HistoryEntry.js";

/**
 * POST /api/ai/generate
 * Generates an AI reply that mimics the user's writing style
 * Body: { user_prompt: string, tone: string, content_type: string }
 * Back-compat: also accepts { message: string, tone: string }
 */
const generate = async (req, res) => {
  try {
    const { message, user_prompt, tone, content_type, thread_id, parent_entry_id } = req.body;
    const userPrompt = (user_prompt ?? message ?? "").toString();
    const contentType = (content_type ?? req.body.contentType ?? "general").toString();
    const threadId = (thread_id ?? req.body.threadId ?? "").toString().trim();
    const parentEntryId = (parent_entry_id ?? req.body.parentEntryId ?? "").toString().trim();

    // Validate inputs
    if (!userPrompt || !tone) {
      return res
        .status(400)
        .json({ error: "Both 'user_prompt' (or 'message') and 'tone' are required." });
    }

    if (userPrompt.trim().length < 2) {
      return res.status(400).json({ error: "Message is too short." });
    }

    const validTones = ["formal", "informal", "casual", "professional", "humorous"];
    if (!validTones.includes(tone)) {
      return res.status(400).json({ error: `Tone must be one of: ${validTones.join(", ")}` });
    }

    const validTypes = ["email", "message", "blog", "general"];
    const normalizedType = contentType.trim().toLowerCase();
    if (!validTypes.includes(normalizedType)) {
      return res
        .status(400)
        .json({ error: `content_type must be one of: ${validTypes.join(", ")}` });
    }

    // Delegate to service layer
    const reply = await generateReply(req.user._id, userPrompt.trim(), tone, normalizedType);

    // Save to history (best-effort; do not fail the request if history write fails)
    let savedEntry = null;
    try {
      const entry = new HistoryEntry({
        userId: req.user._id,
        prompt: userPrompt.trim(),
        output: reply,
        tone,
        contentType: normalizedType,
        parentEntryId: parentEntryId || undefined,
      });

      // First entry in a thread: threadId = _id.
      // Otherwise: use provided threadId.
      entry.threadId = threadId || entry._id;

      savedEntry = await entry.save();
    } catch (historyErr) {
      console.error("History save error:", historyErr.message);
    }

    res.status(200).json({
      reply,
      tone,
      content_type: normalizedType,
      historyEntry: savedEntry
        ? {
            _id: savedEntry._id,
            threadId: savedEntry.threadId,
            parentEntryId: savedEntry.parentEntryId,
            prompt: savedEntry.prompt,
            output: savedEntry.output,
            tone: savedEntry.tone,
            contentType: savedEntry.contentType,
            analysis: savedEntry.analysis,
            createdAt: savedEntry.createdAt,
          }
        : null,
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
