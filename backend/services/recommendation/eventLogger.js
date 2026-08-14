import RecommendationEvent from "../../models/recommendationEventModel.js";

// Thin, fire-and-forget-safe wrapper — event logging must never break the
// action it's recording (a failed LIKE-event write shouldn't fail the like
// itself). Callers await it anyway so ordering stays predictable in tests,
// but errors are swallowed here rather than propagated.
export async function logEvent(userId, targetUserId, type, metadata) {
  try {
    await RecommendationEvent.create({ user: userId, targetUser: targetUserId, type, metadata });
  } catch (err) {
    console.error(`Failed to log ${type} recommendation event:`, err.message);
  }
}
