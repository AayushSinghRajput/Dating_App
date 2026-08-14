const DAY_MS = 24 * 60 * 60 * 1000;
const ACTIVITY_HALF_LIFE_DAYS = 7; // score halves roughly every week of inactivity
const MAX_PHOTOS = 6;
const MIN_BIO_LENGTH_FOR_FULL_CREDIT = 60;

// Every score below is normalized to roughly [0, 1] so rankingEngine's
// configurable weights mean the same thing regardless of which features are
// tuned later — swapping a weight shouldn't require re-deriving the scale.

// Jaccard similarity of hobby lists rather than a raw shared-count, so two
// people with 3 hobbies each and 2 in common score higher than two people
// with 15 hobbies each and the same 2 in common.
function interestScore(viewerHobbies, candidateHobbies) {
  const a = new Set((viewerHobbies || []).map((h) => h.toLowerCase().trim()));
  const b = new Set((candidateHobbies || []).map((h) => h.toLowerCase().trim()));
  if (a.size === 0 || b.size === 0) return 0.5; // no data either way — neutral, not punished

  let intersection = 0;
  for (const hobby of a) if (b.has(hobby)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0.5 : intersection / union;
}

function relationshipGoalScore(viewerGoal, candidateGoal) {
  if (!viewerGoal || !candidateGoal) return 0.5; // unset — don't reward or punish
  const a = viewerGoal.toLowerCase().trim();
  const b = candidateGoal.toLowerCase().trim();
  if (a === b) return 1;
  return 0.2; // stated goals conflict — a soft penalty, not a hard filter (Section 9.5)
}

// Exponential decay from last-active timestamp. Recently active users are
// more likely to actually respond, but this should nudge ranking, not
// dominate it (Section 9.7) — capped contribution is enforced by the weight
// in rankingWeights.js, not here.
function activityScore(lastActiveAt) {
  if (!lastActiveAt) return 0.3; // never tracked — mildly below neutral, not zeroed out
  const daysSinceActive = (Date.now() - new Date(lastActiveAt).getTime()) / DAY_MS;
  if (daysSinceActive <= 0) return 1;
  return Math.pow(0.5, daysSinceActive / ACTIVITY_HALF_LIFE_DAYS);
}

// Rewards a filled-out profile without letting it dominate (Section 9.1)  —
// three independent sub-signals averaged, so a great bio can't fully offset
// zero photos.
function profileCompletenessScore(candidate) {
  const photoScore = Math.min(1, (candidate.photos?.length || 0) / MAX_PHOTOS);
  const bioScore = Math.min(1, (candidate.aboutMe?.length || 0) / MIN_BIO_LENGTH_FOR_FULL_CREDIT);
  const promptScore = Math.min(1, (candidate.prompts?.length || 0) / 3);
  return (photoScore + bioScore + promptScore) / 3;
}

function boostScore(candidate) {
  return candidate.boostedUntil && new Date(candidate.boostedUntil) > new Date() ? 1 : 0;
}

const MAX_AGE_AFFINITY_SPREAD = 15;

// Section 10/11/17 — "who does this user actually engage with?" instead of
// only "what did they say they want?". `tasteProfile` comes from
// behaviorModel.js; its `confidence` (0-1, scales with how much like history
// exists) pulls the score toward neutral (0.5) for cold-start users instead
// of applying a weak signal at full strength — so this feature naturally
// grows in influence as a user generates more data, without rankingEngine
// needing any per-user weight logic of its own.
function behavioralScore(candidate, tasteProfile) {
  if (!tasteProfile) return 0.5; // no like history yet — neutral, not penalized

  const { preferredHobbies, preferredAvgAge, preferredRelationshipGoal, confidence } = tasteProfile;

  let hobbyAffinity = 0.5;
  const candidateHobbies = (candidate.hobbies || []).map((h) => h.toLowerCase().trim());
  if (candidateHobbies.length > 0 && preferredHobbies.size > 0) {
    const maxWeight = Math.max(...preferredHobbies.values());
    const matchedWeight = candidateHobbies.reduce(
      (sum, hobby) => sum + (preferredHobbies.get(hobby) || 0),
      0
    );
    hobbyAffinity = Math.min(1, matchedWeight / (maxWeight * candidateHobbies.length));
  }

  let ageAffinity = 0.5;
  if (preferredAvgAge !== null && typeof candidate.age === "number") {
    const diff = Math.abs(candidate.age - preferredAvgAge);
    ageAffinity = Math.max(0, 1 - diff / MAX_AGE_AFFINITY_SPREAD);
  }

  let goalAffinity = 0.5;
  if (preferredRelationshipGoal && candidate.relationshipGoals) {
    goalAffinity = candidate.relationshipGoals.toLowerCase().trim() === preferredRelationshipGoal ? 1 : 0.3;
  }

  const rawScore = (hobbyAffinity + ageAffinity + goalAffinity) / 3;
  return 0.5 + (rawScore - 0.5) * confidence;
}

// Computes every feature for one viewer/candidate pair. Kept as plain
// functions (not classes) so any single feature can be swapped or replaced
// by a learned model later without touching the others (Section 36).
export function extractFeatures(viewerProfile, candidate, tasteProfile) {
  return {
    interestScore: interestScore(viewerProfile.hobbies, candidate.hobbies),
    relationshipScore: relationshipGoalScore(viewerProfile.relationshipGoals, candidate.relationshipGoals),
    activityScore: activityScore(candidate.userDoc?.lastActiveAt),
    completenessScore: profileCompletenessScore(candidate),
    boostScore: boostScore(candidate),
    behavioralScore: behavioralScore(candidate, tasteProfile),
  };
}
