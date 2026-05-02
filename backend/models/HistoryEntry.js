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
  },
  { timestamps: true }
);

const HistoryEntry = mongoose.model("HistoryEntry", historyEntrySchema);
export default HistoryEntry;
