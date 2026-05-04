// models/HistoryEntry.js
// Stores generated drafts for a user

import mongoose from "mongoose";

const historyEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Threading
    // A "thread" is a group of related generations/edits that belong together.
    // For the first entry in a thread, we set threadId = _id at creation time.
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HistoryEntry",
      index: true,
    },
    parentEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HistoryEntry",
      index: true,
    },

    prompt: {
      type: String,
      required: [true, "Prompt is required"],
      trim: true,
      minlength: 2,
    },
    output: {
      type: String,
      required: [true, "Output is required"],
      trim: true,
      minlength: 2,
    },
    tone: {
      type: String,
      required: [true, "Tone is required"],
      enum: {
        values: ["formal", "informal", "casual", "professional", "humorous"],
        message: "Tone must be one of: formal, informal, casual, professional, humorous",
      },
    },
    contentType: {
      type: String,
      required: [true, "contentType is required"],
      enum: {
        values: ["email", "message", "blog", "general"],
        message: "contentType must be one of: email, message, blog, general",
      },
      default: "general",
    },

    // Persisted evaluation for this output (optional)
    analysis: {
      professionalism: { type: Number },
      clarity: { type: Number },
      tone: { type: String },
      suggestions: { type: [String], default: undefined },
      analyzedAt: { type: Date },
    },

    // User-initiated improvement requests for this output (optional)
    improvementNotes: {
      type: [
        {
          instruction: { type: String, trim: true },
          improvedEntryId: { type: mongoose.Schema.Types.ObjectId, ref: "HistoryEntry" },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: undefined,
    },
  },
  { timestamps: true }
);

const HistoryEntry = mongoose.model("HistoryEntry", historyEntrySchema);
export default HistoryEntry;
