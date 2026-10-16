import mongoose from "mongoose";

const broadcastLogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    targetSegment: {
      type: String,
      default: "all",
    },
    segmentFilters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    targetRecipients: {
      type: Number,
      default: 0,
    },
    deliveredCount: {
      type: Number,
      default: 0,
    },
    openedCount: {
      type: Number,
      default: 0,
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

broadcastLogSchema.index({ createdAt: -1 });

const BroadcastLog = mongoose.model("BroadcastLog", broadcastLogSchema);
export default BroadcastLog;
