import RecommendationImpression from "../../models/recommendationImpressionModel.js";
import { ALGORITHM_VERSION } from "./rankingWeights.js";

// Records one impression per candidate actually returned in a feed page —
// the foundation for freshness (freshnessEngine.js), future exposure/
// popularity monitoring (Section 27), and offline evaluation (Section 32).
// Logging failures must never break the discovery feed itself.
export async function logImpressions(viewerUserId, rankedPage) {
  if (rankedPage.length === 0) return;

  const docs = rankedPage.map((entry, index) => ({
    requestingUser: viewerUserId,
    candidateUser: entry.candidate.user,
    position: index,
    score: entry.finalScore,
    algorithmVersion: ALGORITHM_VERSION,
    features: { ...entry.features, reciprocalScore: entry.reciprocalScore },
  }));

  try {
    await RecommendationImpression.insertMany(docs, { ordered: false });
  } catch (err) {
    console.error("Failed to log recommendation impressions:", err.message);
  }
}
