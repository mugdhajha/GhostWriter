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
    const { original_text, tone, thread_id, parent_entry_id, content_type } = req.body;
    const threadId = (thread_id ?? req.body.threadId ?? "").toString().trim();
    const parentEntryId = (parent_entry_id ?? req.body.parentEntryId ?? "").toString().trim();
    const contentType = (content_type ?? req.body.contentType ?? "general").toString().trim() || "general";

    if (!original_text || String(original_text).trim().length < 2) {
      return res.status(400).json({ error: "'original_text' is required." });
    }

    if (!tone || !validTones.includes(tone)) {
      return res.status(400).json({ error: `Tone must be one of: ${validTones.join(", ")}` });
    }

    const rewritten = await rewriteText(String(original_text).trim(), tone);

    // Best-effort save to history (as general)
    try {
      const entry = new HistoryEntry({
        userId: req.user._id,
        prompt: "Rewrite",
        output: rewritten,
        tone,
        contentType,
        parentEntryId: parentEntryId || undefined,
      });

      entry.threadId = threadId || entry._id;
      await entry.save();
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
    const { text, history_entry_id } = req.body;
    const historyEntryId = (history_entry_id ?? req.body.historyEntryId ?? "").toString().trim();

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

    if (historyEntryId) {
      try {
        const entry = await HistoryEntry.findById(historyEntryId);
        if (entry && entry.userId.toString() === req.user._id.toString()) {
          entry.analysis = {
            professionalism: result.professionalism,
            clarity: result.clarity,
            tone: result.tone,
            suggestions: result.suggestions,
            analyzedAt: new Date(),
          };
          await entry.save();
        }
      } catch (err) {
        console.error("History save error (analyze):", err.message);
      }
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
    const {
      original_text,
      suggestions,
      instruction,
      thread_id,
      parent_entry_id,
      source_entry_id,
      tone,
      content_type,
    } = req.body;

    const threadId = (thread_id ?? req.body.threadId ?? "").toString().trim();
    const parentEntryId = (parent_entry_id ?? req.body.parentEntryId ?? "").toString().trim();
    const sourceEntryId = (source_entry_id ?? req.body.sourceEntryId ?? "").toString().trim();
    const contentType = (content_type ?? req.body.contentType ?? "general").toString().trim() || "general";

    if (!original_text || String(original_text).trim().length < 2) {
      return res.status(400).json({ error: "'original_text' is required." });
    }

    const providedSuggestions = Array.isArray(suggestions) ? suggestions : null;
    const providedInstruction = typeof instruction === "string" ? instruction.trim() : "";

    if ((!providedSuggestions || providedSuggestions.length === 0) && !providedInstruction) {
      return res.status(400).json({
        error: "Provide either 'suggestions' (non-empty array) or 'instruction' (non-empty string).",
      });
    }

    const improved = await improveText(
      String(original_text).trim(),
      providedSuggestions && providedSuggestions.length > 0 ? providedSuggestions : providedInstruction
    );

    // Best-effort save to history (as general)
    let savedEntry = null;
    try {
      const entry = new HistoryEntry({
        userId: req.user._id,
        prompt: providedInstruction || "Improve",
        output: improved,
        tone: validTones.includes(tone) ? tone : "professional",
        contentType,
        parentEntryId: parentEntryId || undefined,
      });

      entry.threadId = threadId || entry._id;
      savedEntry = await entry.save();

      if (sourceEntryId) {
        try {
          const source = await HistoryEntry.findById(sourceEntryId);
          if (source && source.userId.toString() === req.user._id.toString()) {
            const nextNotes = Array.isArray(source.improvementNotes) ? source.improvementNotes : [];
            nextNotes.push({
              instruction: providedInstruction || "Improve",
              improvedEntryId: savedEntry?._id,
              createdAt: new Date(),
            });
            source.improvementNotes = nextNotes;
            await source.save();
          }
        } catch (err) {
          console.error("History update error (improvementNotes):", err.message);
        }
      }
    } catch (err) {
      console.error("History save error (improve):", err.message);
    }

    return res.status(200).json({
      output: improved,
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
    console.error("Improve error:", error.message);
    return res.status(500).json({ error: "Improve failed. Please try again." });
  }
};

export { rewrite, analyze, improve };
