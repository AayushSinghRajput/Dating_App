import mongoose from "mongoose";

const blocklistSchema = new mongoose.Schema(
  {
    phrase: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    category: {
      type: String,
      enum: ["profanity", "harassment", "spam_scam", "phone_contact", "commercial", "hate_speech"],
      default: "profanity",
    },
    action: {
      type: String,
      enum: ["block", "flag", "replace"],
      default: "replace",
    },
    replacement: {
      type: String,
      default: "***",
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

blocklistSchema.index({ category: 1 });

const Blocklist = mongoose.model("Blocklist", blocklistSchema);
export default Blocklist;
