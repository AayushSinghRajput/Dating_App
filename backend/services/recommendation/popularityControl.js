import RecommendationImpression from "../../models/recommendationImpressionModel.js";

const EXPOSURE_WINDOW_DAYS = 30;
const PENALTY_PERCENTILE = 0.9; // candidates above this percentile of *this pool's* exposure start getting damped
const MAX_POPULARITY_PENALTY = 0.15; // capped low — a monitoring-oriented nudge, not a punishment

async function getExposureCounts(candidateUserIds) {
  if (candidateUserIds.length === 0) return new Map();
  const since = new Date(Date.now() - EXPOSURE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const results = await RecommendationImpression.aggregate([
    { $match: { candidateUser: { $in: candidateUserIds }, createdAt: { $gte: since } } },
    { $group: { _id: "$candidateUser", count: { $sum: 1 } } },
  ]);
  return new Map(results.map((r) => [r._id.toString(), r.count]));
}

// Section 24 — guards against the "popular -> more exposure -> more likes ->
// higher ranking -> more exposure" feedback loop. Distinct from
// freshnessEngine (which only penalizes repeat exposure to *this specific
// viewer*) and from explorationEngine's low-exposure prioritization (which
// only affects its own reserved slice) — this applies across the *entire*
// ranked pool, including the exploit portion, which is exactly where an
// unchecked popularity loop would otherwise entrench itself.
//
// The threshold is relative to this candidate pool's own exposure spread,
// not an absolute number — a pool of mostly-inactive profiles shouldn't
// have its single most-shown member unfairly flagged as "popular".
export async function computePopularityPenalties(candidates) {
  const penaltyByProfileId = new Map();
  if (candidates.length < 5) return penaltyByProfileId; // too small a pool for a percentile to be meaningful

  const candidateUserIds = candidates.map((c) => c.user);
  const exposureByUserId = await getExposureCounts(candidateUserIds);

  const exposures = candidates.map((c) => exposureByUserId.get(c.user.toString()) || 0);
  const sorted = [...exposures].sort((a, b) => a - b);
  const threshold = sorted[Math.floor(sorted.length * PENALTY_PERCENTILE)];
  const maxExposure = sorted[sorted.length - 1];

  if (maxExposure === threshold) return penaltyByProfileId; // no meaningful spread in this pool

  for (const candidate of candidates) {
    const exposure = exposureByUserId.get(candidate.user.toString()) || 0;
    if (exposure > threshold) {
      const overshoot = (exposure - threshold) / (maxExposure - threshold);
      penaltyByProfileId.set(
        candidate._id.toString(),
        Math.min(MAX_POPULARITY_PENALTY, overshoot * MAX_POPULARITY_PENALTY)
      );
    }
  }

  return penaltyByProfileId;
}
