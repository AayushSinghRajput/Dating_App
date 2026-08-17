import { extractFeatures } from "./featureExtractor.js";
import { RANKING_WEIGHTS } from "./rankingWeights.js";

// Combines every feature into one score per candidate using the given
// weights (Section 16's `finalScore = sum(weight * feature)` formulation).
// Weights are a parameter (default RANKING_WEIGHTS) rather than a fixed
// import so callers can select a different named variant per Section 33/34's
// A/B experimentation — see rankingWeights.js's RANKING_WEIGHT_VARIANTS and
// getVariantForUser, and index.js for where the variant is resolved.
// Nothing here is safety- or eligibility-related — by the time a candidate
// reaches this stage it has already passed safetyFilter + hardFilter, so a
// low score can only affect ordering, never exclude someone outright.
export function scoreCandidates(
  viewerProfile,
  candidates,
  freshnessPenaltyByCandidateId,
  tasteProfile,
  reciprocalScoreByCandidateId,
  popularityPenaltyByCandidateId,
  weights = RANKING_WEIGHTS,
  collaborativeSignal = null
) {
  return candidates.map((candidate) => {
    const features = extractFeatures(viewerProfile, candidate, tasteProfile, collaborativeSignal);
    const reciprocalScore = reciprocalScoreByCandidateId?.get(candidate._id.toString()) ?? 0.5;

    const rawScore =
      features.interestScore * weights.interestScore +
      features.relationshipScore * weights.relationshipScore +
      features.activityScore * weights.activityScore +
      features.completenessScore * weights.completenessScore +
      features.boostScore * weights.boostScore +
      features.behavioralScore * weights.behavioralScore +
      features.lifestyleScore * weights.lifestyleScore +
      features.distanceScore * weights.distanceScore +
      features.collaborativeScore * weights.collaborativeScore +
      reciprocalScore * weights.reciprocalScore;

    const freshnessPenalty = freshnessPenaltyByCandidateId.get(candidate._id.toString()) || 0;
    const popularityPenalty = popularityPenaltyByCandidateId?.get(candidate._id.toString()) || 0;
    const finalScore = Math.max(0, rawScore - freshnessPenalty - popularityPenalty);

    return { candidate, features, reciprocalScore, finalScore };
  });
}

export function rankByScore(scoredCandidates) {
  return [...scoredCandidates].sort((a, b) => b.finalScore - a.finalScore);
}
