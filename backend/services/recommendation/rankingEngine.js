import { extractFeatures } from "./featureExtractor.js";
import { RANKING_WEIGHTS } from "./rankingWeights.js";

// Combines every feature into one score per candidate using the configured
// weights (Section 16's `finalScore = sum(weight * feature)` formulation).
// Nothing here is safety- or eligibility-related — by the time a candidate
// reaches this stage it has already passed safetyFilter + hardFilter, so a
// low score can only affect ordering, never exclude someone outright.
export function scoreCandidates(
  viewerProfile,
  candidates,
  freshnessPenaltyByCandidateId,
  tasteProfile,
  reciprocalScoreByCandidateId,
  popularityPenaltyByCandidateId
) {
  return candidates.map((candidate) => {
    const features = extractFeatures(viewerProfile, candidate, tasteProfile);
    const reciprocalScore = reciprocalScoreByCandidateId?.get(candidate._id.toString()) ?? 0.5;

    const rawScore =
      features.interestScore * RANKING_WEIGHTS.interestScore +
      features.relationshipScore * RANKING_WEIGHTS.relationshipScore +
      features.activityScore * RANKING_WEIGHTS.activityScore +
      features.completenessScore * RANKING_WEIGHTS.completenessScore +
      features.boostScore * RANKING_WEIGHTS.boostScore +
      features.behavioralScore * RANKING_WEIGHTS.behavioralScore +
      features.lifestyleScore * RANKING_WEIGHTS.lifestyleScore +
      features.distanceScore * RANKING_WEIGHTS.distanceScore +
      reciprocalScore * RANKING_WEIGHTS.reciprocalScore;

    const freshnessPenalty = freshnessPenaltyByCandidateId.get(candidate._id.toString()) || 0;
    const popularityPenalty = popularityPenaltyByCandidateId?.get(candidate._id.toString()) || 0;
    const finalScore = Math.max(0, rawScore - freshnessPenalty - popularityPenalty);

    return { candidate, features, reciprocalScore, finalScore };
  });
}

export function rankByScore(scoredCandidates) {
  return [...scoredCandidates].sort((a, b) => b.finalScore - a.finalScore);
}
