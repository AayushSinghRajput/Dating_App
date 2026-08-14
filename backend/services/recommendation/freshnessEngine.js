import mongoose from "mongoose";
import RecommendationImpression from "../../models/recommendationImpressionModel.js";

const FRESHNESS_WINDOW_HOURS = 72;
const PENALTY_PER_IMPRESSION = 0.08;
const MAX_PENALTY = 0.35;

// Section 26 — repeatedly showing the same candidate in a short window gets
// a ranking penalty instead of being hard-excluded, so a candidate can still
// resurface if their score is strong enough to outweigh it (e.g. they just
// became active, or the viewer's own preferences changed).
export async function computeFreshnessPenalties(viewerUserId, candidates) {
  const penaltyByProfileId = new Map();
  if (candidates.length === 0) return penaltyByProfileId;

  const since = new Date(Date.now() - FRESHNESS_WINDOW_HOURS * 60 * 60 * 1000);
  const candidateUserIds = candidates.map((c) => c.user);

  const recentImpressions = await RecommendationImpression.aggregate([
    {
      $match: {
        requestingUser: new mongoose.Types.ObjectId(viewerUserId),
        candidateUser: { $in: candidateUserIds },
        createdAt: { $gte: since },
      },
    },
    { $group: { _id: "$candidateUser", count: { $sum: 1 } } },
  ]);

  const countByCandidateUserId = new Map(
    recentImpressions.map((r) => [r._id.toString(), r.count])
  );

  for (const candidate of candidates) {
    const count = countByCandidateUserId.get(candidate.user.toString()) || 0;
    if (count > 0) {
      penaltyByProfileId.set(
        candidate._id.toString(),
        Math.min(MAX_PENALTY, count * PENALTY_PER_IMPRESSION)
      );
    }
  }

  return penaltyByProfileId;
}
