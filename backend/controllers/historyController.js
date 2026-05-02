// controllers/historyController.js

import HistoryEntry from "../models/HistoryEntry.js";

/**
 * GET /api/history
 */
const getHistory = async (req, res) => {
  try {
    const entries = await HistoryEntry.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ count: entries.length, entries });
  } catch (error) {
    console.error("Get history error:", error.message);
    return res.status(500).json({ error: "Server error. Could not fetch history." });
  }
};

/**
 * DELETE /api/history/:id
 */
const deleteHistory = async (req, res) => {
  try {
    const entry = await HistoryEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ error: "History entry not found." });
    }

    if (entry.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to delete this entry." });
    }

    await entry.deleteOne();
    return res.status(200).json({ message: "History entry deleted." });
  } catch (error) {
    console.error("Delete history error:", error.message);
    return res.status(500).json({ error: "Server error. Could not delete history entry." });
  }
};

export { getHistory, deleteHistory };
