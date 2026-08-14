import mongoose from "mongoose";

// Behavioral event log (Section 20/39) — distinct from RecommendationImpression
// (which only records "this candidate was shown"). This records what the
// user actually DID, and is the raw material behaviorModel.js aggregates
// into a per-user taste profile for Phase 2's behavioral personalization.
const recommendationEventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "LIKE",
        "PASS",
        "SUPER_LIKE",
        "MATCH",
        "UNMATCH",
        "MESSAGE_SENT",
        "MESSAGE_REPLIED",
        "SUSTAINED_CONVERSATION",
        "PROFILE_VIEW",
        "BLOCK",
        "REPORT",
      ],
      required: true,
    },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

// behaviorModel.js's primary query: "this user's recent LIKE events, newest first".
recommendationEventSchema.index({ user: 1, type: 1, createdAt: -1 });
// Exposure/received-signal analysis: "what has this candidate received?"
recommendationEventSchema.index({ targetUser: 1, type: 1 });

const RecommendationEvent = mongoose.model("RecommendationEvent", recommendationEventSchema);
export default RecommendationEvent;
