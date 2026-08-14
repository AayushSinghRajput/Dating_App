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

// Section 29 — negative feedback must shape future recommendations, not
// just hard-exclude the one specific person (that's safetyFilter's job).
// A block/report is a much stronger, more deliberate signal than an
// ordinary pass, so it's weighted well beyond it rather than being folded
// in as "just another small ranking penalty".
const LIKE_WEIGHT = 1;
const PASS_WEIGHT = -0.3;
const BLOCK_OR_REPORT_WEIGHT = -1.5;

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

// Shared aggregation core for both buildTasteProfile (one user) and
// buildTasteProfilesForUsers (many users, batched) — takes a signed list of
// {profile, weight} interactions (positive = liked, negative = passed on or
// blocked/reported) and derives the user's apparent taste, including what
// they seem to avoid.
function summarizeInteractions(weightedProfiles) {
  if (weightedProfiles.length === 0) return null;

  const hobbyWeights = new Map(); // signed: positive = drawn to, negative = avoided
  const goalWeights = new Map(); // signed, per relationshipGoals value
  let ageSum = 0;
  let ageWeight = 0;
  let likeCount = 0;

  for (const { profile, weight } of weightedProfiles) {
    if (weight > 0) likeCount += 1;

    for (const hobby of profile.hobbies || []) {
      const key = hobby.toLowerCase().trim();
      hobbyWeights.set(key, (hobbyWeights.get(key) || 0) + weight);
    }
    if (profile.relationshipGoals) {
      const key = profile.relationshipGoals.toLowerCase().trim();
      goalWeights.set(key, (goalWeights.get(key) || 0) + weight);
    }
    // Age preference is only learned from positive signal — a passed/blocked
    // profile's age isn't a reliable signal about age preference specifically
    // (they were more likely passed/blocked for an unrelated reason).
    if (typeof profile.age === "number" && weight > 0) {
      ageSum += profile.age * weight;
      ageWeight += weight;
    }
  }

  let preferredRelationshipGoal = null;
  let bestGoalWeight = 0;
  let avoidedRelationshipGoal = null;
  let worstGoalWeight = 0;
  for (const [goal, weight] of goalWeights) {
    if (weight > bestGoalWeight) {
      preferredRelationshipGoal = goal;
      bestGoalWeight = weight;
    }
    if (weight < worstGoalWeight) {
      avoidedRelationshipGoal = goal;
      worstGoalWeight = weight;
    }
  }

  return {
    confidence: Math.min(1, likeCount / FULL_CONFIDENCE_LIKE_COUNT),
    hobbyWeights,
    preferredAvgAge: ageWeight > 0 ? ageSum / ageWeight : null,
    preferredRelationshipGoal,
    avoidedRelationshipGoal,
  };
}

async function fetchWeightedProfiles(eventFilter) {
  const events = await RecommendationEvent.find(eventFilter)
    .sort({ createdAt: -1 })
    .select("targetUser type")
    .lean();
  if (events.length === 0) return { events: [], targetUserIds: [] };
  return { events, targetUserIds: events.map((e) => e.targetUser) };
}

function weightForType(type) {
  if (type === "LIKE" || type === "SUPER_LIKE") return LIKE_WEIGHT;
  if (type === "PASS") return PASS_WEIGHT;
  return BLOCK_OR_REPORT_WEIGHT; // BLOCK, REPORT
}

// Section 11/29 — "who does this user actually engage with, and who do
// they avoid?", derived from LIKE/SUPER_LIKE (positive), PASS (mild
// negative), and BLOCK/REPORT (strong negative) history rather than asked
// of them directly. Returns null for cold-start users (no history at all),
// which featureExtractor.js treats as "no behavioral signal" rather than
// penalizing anyone.
export async function buildTasteProfile(viewerUserId) {
  const { events, targetUserIds } = await fetchWeightedProfiles({
    user: viewerUserId,
    type: { $in: ["LIKE", "SUPER_LIKE", "PASS", "BLOCK", "REPORT"] },
  });
  if (events.length === 0) return null;

  // Likes are capped to the most recent MAX_LIKES_CONSIDERED for recency;
  // negative signal (pass/block/report) is comparatively rare and kept in
  // full rather than truncated the same way.
  const likeEvents = events.filter((e) => e.type === "LIKE" || e.type === "SUPER_LIKE").slice(0, MAX_LIKES_CONSIDERED);
  const negativeEvents = events.filter((e) => e.type !== "LIKE" && e.type !== "SUPER_LIKE");
  const relevantEvents = [...likeEvents, ...negativeEvents];

  const profiles = await Profile.find({ user: { $in: targetUserIds } })
    .select("user hobbies age relationshipGoals")
    .lean();
  const profileByUserId = new Map(profiles.map((p) => [p.user.toString(), p]));

  const weightedProfiles = relevantEvents
    .map((event) => {
      const profile = profileByUserId.get(event.targetUser.toString());
      return profile ? { profile, weight: weightForType(event.type) } : null;
    })
    .filter(Boolean);

  return summarizeInteractions(weightedProfiles);
}

// Section 13 — "behavioral reciprocity" needs each CANDIDATE's own taste
// profile too (to estimate whether they'd likely be drawn to the viewer).
// Doing that with buildTasteProfile() once per candidate would be an N+1
// query explosion across a few hundred candidates — this batches it into a
// small, fixed number of queries instead.
export async function buildTasteProfilesForUsers(userIds) {
  const result = new Map();
  if (userIds.length === 0) return result;

  const events = await RecommendationEvent.aggregate([
    { $match: { user: { $in: userIds }, type: { $in: ["LIKE", "SUPER_LIKE", "PASS", "BLOCK", "REPORT"] } } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: "$user", events: { $push: { targetUser: "$targetUser", type: "$type" } } } },
  ]);

  const eventsByUserId = new Map(events.map((e) => [e._id.toString(), e.events]));

  const allTargetUserIds = [
    ...new Set(events.flatMap((e) => e.events.map((ev) => ev.targetUser.toString()))),
  ];
  if (allTargetUserIds.length === 0) return result;

  const profiles = await Profile.find({ user: { $in: allTargetUserIds } })
    .select("user hobbies age relationshipGoals")
    .lean();
  const profileByUserId = new Map(profiles.map((p) => [p.user.toString(), p]));

  for (const [userId, userEvents] of eventsByUserId) {
    const likeEvents = userEvents
      .filter((e) => e.type === "LIKE" || e.type === "SUPER_LIKE")
      .slice(0, MAX_LIKES_CONSIDERED);
    const negativeEvents = userEvents.filter((e) => e.type !== "LIKE" && e.type !== "SUPER_LIKE");

    const weightedProfiles = [...likeEvents, ...negativeEvents]
      .map((event) => {
        const profile = profileByUserId.get(event.targetUser.toString());
        return profile ? { profile, weight: weightForType(event.type) } : null;
      })
      .filter(Boolean);

    const summary = summarizeInteractions(weightedProfiles);
    if (summary) result.set(userId, summary);
  }

  return result;
}

export { clamp01 };
