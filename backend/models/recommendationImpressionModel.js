import mongoose from "mongoose";

// One row per candidate shown in a discovery feed response. Powers the
// freshness/repeat-exposure penalty now, and doubles as the foundation for
// later recommendation-quality analysis (position bias, exposure
// distribution, offline evaluation) without needing a schema migration.
const recommendationImpressionSchema = new mongoose.Schema(
  {
    requestingUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    candidateUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    position: { type: Number, required: true },
    score: { type: Number, required: true },
    algorithmVersion: { type: String, required: true },
    // Section 33/34 — which named ranking-weight configuration produced this
    // score (see rankingWeights.js's RANKING_WEIGHT_VARIANTS). Optional so
    // impressions logged before this field existed don't need a migration;
    // absent on those older docs rather than defaulted, so it's never
    // mistaken for an actual "control" assignment.
    experimentVariant: { type: String },
    // Per-feature breakdown behind `score` (Section 35 — explainability).
    // Kept loose/Mixed rather than a strict sub-schema since the feature set
    // is expected to change as later phases add/replace signals.
    features: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Freshness lookups: "how often have I shown candidate X to user Y recently?"
recommendationImpressionSchema.index({ requestingUser: 1, candidateUser: 1, createdAt: -1 });
// Exposure monitoring: "how often has candidate X been shown to anyone?"
recommendationImpressionSchema.index({ candidateUser: 1, createdAt: -1 });
// Impressions are only useful for a little while — auto-expire after 30 days
// instead of growing this collection unbounded.
recommendationImpressionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

const RecommendationImpression = mongoose.model(
  "RecommendationImpression",
  recommendationImpressionSchema
);
export default RecommendationImpression;
