// models/WritingSample.js
// Mongoose schema for user writing samples

import mongoose from "mongoose";

const writingSampleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: [true, "Sample text is required"],
      trim: true,
      minlength: [10, "Sample must be at least 10 characters"],
    },
    tone: {
      type: String,
      required: [true, "Tone is required"],
      enum: {
        values: ["formal", "informal", "casual", "professional", "humorous"],
        message: "Tone must be one of: formal, informal, casual, professional, humorous",
      },
    },
  },
  {
    timestamps: true,
  }
);

const WritingSample = mongoose.model("WritingSample", writingSampleSchema);
export default WritingSample;
