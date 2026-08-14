import RecommendationEvent from "../../models/recommendationEventModel.js";
import Profile from "../../models/profileModel.js";

// How many of the most recent likes to learn from — recent taste matters
// more than a user's entire lifetime history, and this keeps the query cheap.
const MAX_LIKES_CONSIDERED = 50;
// Confidence ramps from 0 (no behavioral signal) to 1 (full weight) as likes
// accumulate. These are starting values (Section 42 explicitly calls out
// that such thresholds are examples, not universal constants) — tune once
// real usage data exists.
const FULL_CONFIDENCE_LIKE_COUNT = 20;

// Shared aggregation core for both buildTasteProfile (one user) and
// buildTasteProfilesForUsers (many users, batched) — takes the profiles of
// whoever a user liked and derives their apparent "type".
function summarizeLikedProfiles(likedProfiles, likeCount) {
  if (likedProfiles.length === 0) return null;

  const hobbyWeights = new Map();
  const goalCounts = new Map();
  let ageSum = 0;
  let ageCount = 0;

  for (const profile of likedProfiles) {
    for (const hobby of profile.hobbies || []) {
      const key = hobby.toLowerCase().trim();
      hobbyWeights.set(key, (hobbyWeights.get(key) || 0) + 1);
    }
    if (profile.relationshipGoals) {
      const key = profile.relationshipGoals.toLowerCase().trim();
      goalCounts.set(key, (goalCounts.get(key) || 0) + 1);
    }
    if (typeof profile.age === "number") {
      ageSum += profile.age;
      ageCount += 1;
    }
  }

  let topGoal = null;
  let topGoalCount = 0;
  for (const [goal, count] of goalCounts) {
    if (count > topGoalCount) {
      topGoal = goal;
      topGoalCount = count;
    }
  }

  return {
    confidence: Math.min(1, likeCount / FULL_CONFIDENCE_LIKE_COUNT),
    preferredHobbies: hobbyWeights,
    preferredAvgAge: ageCount > 0 ? ageSum / ageCount : null,
    preferredRelationshipGoal: topGoal,
  };
}

// Section 11 — "who does this user actually engage with?", derived from
// their own LIKE/SUPER_LIKE history rather than asked of them directly.
// Returns null for cold-start users (no likes yet), which featureExtractor.js
// treats as "no behavioral signal" rather than penalizing anyone.
export async function buildTasteProfile(viewerUserId) {
  const likeEvents = await RecommendationEvent.find({
    user: viewerUserId,
    type: { $in: ["LIKE", "SUPER_LIKE"] },
  })
    .sort({ createdAt: -1 })
    .limit(MAX_LIKES_CONSIDERED)
    .select("targetUser")
    .lean();

  if (likeEvents.length === 0) return null;

  const likedUserIds = likeEvents.map((e) => e.targetUser);
  const likedProfiles = await Profile.find({ user: { $in: likedUserIds } })
    .select("hobbies age relationshipGoals")
    .lean();

  return summarizeLikedProfiles(likedProfiles, likeEvents.length);
}

// Section 13 — "behavioral reciprocity" needs each CANDIDATE's own taste
// profile too (to estimate whether they'd likely be drawn to the viewer).
// Doing that with buildTasteProfile() once per candidate would be an N+1
// query explosion across a few hundred candidates — this batches it into
// two queries total instead.
export async function buildTasteProfilesForUsers(userIds) {
  const result = new Map();
  if (userIds.length === 0) return result;

  const likeEvents = await RecommendationEvent.aggregate([
    { $match: { user: { $in: userIds }, type: { $in: ["LIKE", "SUPER_LIKE"] } } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: "$user", targetUsers: { $push: "$targetUser" } } },
  ]);

  const cappedByUserId = new Map(
    likeEvents.map((e) => [e._id.toString(), e.targetUsers.slice(0, MAX_LIKES_CONSIDERED)])
  );

  const allLikedUserIds = [...new Set([...cappedByUserId.values()].flat().map((id) => id.toString()))];
  if (allLikedUserIds.length === 0) return result;

  const likedProfiles = await Profile.find({ user: { $in: allLikedUserIds } })
    .select("user hobbies age relationshipGoals")
    .lean();
  const profileByUserId = new Map(likedProfiles.map((p) => [p.user.toString(), p]));

  for (const [userId, targetUserIds] of cappedByUserId) {
    const profiles = targetUserIds
      .map((id) => profileByUserId.get(id.toString()))
      .filter(Boolean);
    const summary = summarizeLikedProfiles(profiles, targetUserIds.length);
    if (summary) result.set(userId, summary);
  }

  return result;
}
