import mongoose from "mongoose";

const promptModerationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
    },
    type: {
      type: String,
      enum: ["voice_prompt", "text_prompt"],
      default: "text_prompt",
      index: true,
    },
    promptQuestion: {
      type: String,
      required: true,
      trim: true,
    },
    promptAnswer: {
      type: String,
      default: "",
      trim: true,
    },
    audioUrl: {
      type: String,
      default: "",
    },
    duration: {
      type: Number,
      default: 0,
    },
    transcript: {
      type: String,
      default: "",
    },
    flagReason: {
      type: String,
      required: true,
      default: "Flagged for manual review",
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "removed"],
      default: "pending",
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    adminNotes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

promptModerationSchema.index({ status: 1, type: 1, createdAt: -1 });

const PromptModeration = mongoose.model("PromptModeration", promptModerationSchema);
export default PromptModeration;
