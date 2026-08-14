import RecommendationImpression from "../../models/recommendationImpressionModel.js";
import { EXPLORATION_RATIO } from "./rankingWeights.js";

async function getExposureCounts(candidateUserIds) {
  if (candidateUserIds.length === 0) return new Map();
  const results = await RecommendationImpression.aggregate([
    { $match: { candidateUser: { $in: candidateUserIds } } },
    { $group: { _id: "$candidateUser", count: { $sum: 1 } } },
  ]);
  return new Map(results.map((r) => [r._id.toString(), r.count]));
}

// Section 23 — don't only ever show the highest-ranked candidates. Reserves
// a configurable slice of each page for less-exposed candidates so profiles
// that haven't accumulated much signal yet (including brand-new users) get
// a chance to be seen instead of being permanently buried by early scores.
export async function applyExploration(rankedCandidates, limit) {
  if (rankedCandidates.length <= limit) return rankedCandidates;

  const exploreCount = Math.round(limit * EXPLORATION_RATIO);
  const exploitCount = limit - exploreCount;

  const exploitPicks = rankedCandidates.slice(0, exploitCount);
  const remainder = rankedCandidates.slice(exploitCount);

  const remainderUserIds = remainder.map((entry) => entry.candidate.user);
  const exposureByUserId = await getExposureCounts(remainderUserIds);

  const explorePicks = [...remainder]
    .sort((a, b) => {
      const exposureA = exposureByUserId.get(a.candidate.user.toString()) || 0;
      const exposureB = exposureByUserId.get(b.candidate.user.toString()) || 0;
      if (exposureA !== exposureB) return exposureA - exposureB; // least-exposed first
      return b.finalScore - a.finalScore; // tie-break on score
    })
    .slice(0, exploreCount);

  // Interleave explore picks evenly through the exploit list instead of
  // clumping them at the end (Section 25's ordering example — exploration
  // candidates appear mixed in, not dumped at the bottom of the feed).
  const merged = [...exploitPicks];
  const step = explorePicks.length > 0 ? Math.max(1, Math.floor(merged.length / explorePicks.length)) : 0;
  explorePicks.forEach((pick, index) => {
    const insertAt = Math.min(merged.length, (index + 1) * step);
    merged.splice(insertAt, 0, pick);
  });

  return merged.slice(0, limit);
}
