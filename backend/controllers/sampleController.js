// controllers/sampleController.js
// CRUD operations for writing samples

import WritingSample from "../models/WritingSample.js";

/**
 * POST /api/samples/add
 * Adds a new writing sample for the authenticated user
 */
const addSample = async (req, res) => {
  try {
    const { text, tone } = req.body;

    // Validate inputs
    if (!text || !tone) {
      return res.status(400).json({ error: "Text and tone are required." });
    }

    if (text.trim().length < 10) {
      return res.status(400).json({ error: "Sample text must be at least 10 characters." });
    }

    const validTones = ["formal", "informal", "casual", "professional", "humorous"];
    if (!validTones.includes(tone)) {
      return res.status(400).json({ error: `Tone must be one of: ${validTones.join(", ")}` });
    }

    const sample = await WritingSample.create({
      userId: req.user._id,
      text: text.trim(),
      tone,
    });

    res.status(201).json({
      message: "Writing sample added successfully.",
      sample,
    });
  } catch (error) {
    console.error("Add sample error:", error.message);
    res.status(500).json({ error: "Server error. Could not add sample." });
  }
};

/**
 * GET /api/samples
 * Returns all writing samples for the authenticated user
 */
const getSamples = async (req, res) => {
  try {
    const samples = await WritingSample.find({ userId: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      count: samples.length,
      samples,
    });
  } catch (error) {
    console.error("Get samples error:", error.message);
    res.status(500).json({ error: "Server error. Could not fetch samples." });
  }
};

/**
 * DELETE /api/samples/:id
 * Deletes a specific writing sample (only if it belongs to the user)
 */
const deleteSample = async (req, res) => {
  try {
    const sample = await WritingSample.findById(req.params.id);

    if (!sample) {
      return res.status(404).json({ error: "Sample not found." });
    }

    // Ensure the sample belongs to the requesting user
    if (sample.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to delete this sample." });
    }

    await sample.deleteOne();

    res.status(200).json({ message: "Sample deleted successfully." });
  } catch (error) {
    console.error("Delete sample error:", error.message);
    res.status(500).json({ error: "Server error. Could not delete sample." });
  }
};

export { addSample, getSamples, deleteSample };
