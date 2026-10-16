import mongoose from "mongoose";

const moderationFlagSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    photoUrl: {
      type: String,
      required: true,
    },
    flagType: {
      type: String,
      enum: ["nsfw", "spam", "hate", "violence", "ai_detected", "user_flagged"],
      default: "nsfw",
    },
    confidenceScore: {
      type: Number,
      default: 85,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    reviewNotes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

moderationFlagSchema.index({ status: 1, createdAt: -1 });
moderationFlagSchema.index({ user: 1 });

const ModerationFlag = mongoose.model("ModerationFlag", moderationFlagSchema);
export default ModerationFlag;
