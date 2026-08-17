const DAY_MS = 24 * 60 * 60 * 1000;
const ACTIVITY_HALF_LIFE_DAYS = 7; // score halves roughly every week of inactivity
const MAX_PHOTOS = 6;
const MIN_BIO_LENGTH_FOR_FULL_CREDIT = 60;
const EARTH_RADIUS_KM = 6371;
// When the viewer hasn't set an explicit max-distance preference, this is
// the reference distance at which distanceScore bottoms out at 0 — closer
// than this still nudges ranking, it just isn't a hard cutoff (that's
// hardFilter.js's job, and only applies when maxDistanceKm *is* set).
const DEFAULT_DISTANCE_SCALE_KM = 50;

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

function haversineDistanceKm([lng1, lat1], [lng2, lat2]) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Section 9.6 — distance as a *soft* ranking signal (closer scores higher),
// separate from the hard cutoff in hardFilter.js. Neutral when either side
// hasn't shared their location — this never punishes someone for not
// granting location access, it just can't reward proximity it doesn't know.
function distanceScore(viewerProfile, candidate) {
  const viewerCoords = viewerProfile.coordinates?.coordinates;
  const candidateCoords = candidate.coordinates?.coordinates;
  if (!viewerCoords || !candidateCoords) return 0.5;

  const distanceKm = haversineDistanceKm(viewerCoords, candidateCoords);
  const scale = viewerProfile.preferences?.maxDistanceKm || DEFAULT_DISTANCE_SCALE_KM;
  return Math.max(0, 1 - distanceKm / scale);
}

// Section 9.4 — lifestyle compatibility. Each dimension is independent (a
// smoking mismatch shouldn't be masked by pet compatibility), voluntary,
// and neutral when either side hasn't stated a value — this only ever
// scores what two people *chose to share*, matching Section 30's guidance
// not to infer or penalize based on unstated sensitive attributes. Any
// dimension the viewer has marked as a dealbreaker (Section 6) never
// reaches this function at all — it's already a hard filter by then.
function lifestyleDimensionScore(viewerValue, candidateValue) {
  if (!viewerValue || !candidateValue) return 0.5;
  return viewerValue === candidateValue ? 1 : 0.4;
}

function lifestyleScore(viewerLifestyle, candidateLifestyle) {
  const dimensions = ["smoking", "drinking", "pets", "wantsChildren"];
  const scores = dimensions.map((d) =>
    lifestyleDimensionScore(viewerLifestyle?.[d], candidateLifestyle?.[d])
  );
  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
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
  if (!tasteProfile) return 0.5; // no interaction history yet — neutral, not penalized

  const { hobbyWeights, preferredAvgAge, preferredRelationshipGoal, avoidedRelationshipGoal, confidence } =
    tasteProfile;

  // hobbyWeights is signed (Section 29) — positive entries came from likes,
  // negative from passes/blocks/reports, so a candidate whose hobbies match
  // an avoided pattern pulls this below neutral rather than merely failing
  // to score above it.
  let hobbyAffinity = 0.5;
  const candidateHobbies = (candidate.hobbies || []).map((h) => h.toLowerCase().trim());
  if (candidateHobbies.length > 0 && hobbyWeights.size > 0) {
    const maxAbsWeight = Math.max(1, ...[...hobbyWeights.values()].map(Math.abs));
    const matchedWeight = candidateHobbies.reduce(
      (sum, hobby) => sum + (hobbyWeights.get(hobby) || 0),
      0
    );
    const normalized = matchedWeight / (maxAbsWeight * candidateHobbies.length);
    hobbyAffinity = Math.max(0, Math.min(1, 0.5 + normalized * 0.5));
  }

  let ageAffinity = 0.5;
  if (preferredAvgAge !== null && typeof candidate.age === "number") {
    const diff = Math.abs(candidate.age - preferredAvgAge);
    ageAffinity = Math.max(0, 1 - diff / MAX_AGE_AFFINITY_SPREAD);
  }

  let goalAffinity = 0.5;
  const candidateGoal = candidate.relationshipGoals?.toLowerCase().trim();
  if (candidateGoal && avoidedRelationshipGoal && candidateGoal === avoidedRelationshipGoal) {
    goalAffinity = 0; // strong negative signal (block/report pattern) — not a mild penalty
  } else if (preferredRelationshipGoal && candidateGoal) {
    goalAffinity = candidateGoal === preferredRelationshipGoal ? 1 : 0.3;
  }

  const rawScore = (hobbyAffinity + ageAffinity + goalAffinity) / 3;
  return 0.5 + (rawScore - 0.5) * confidence;
}

// Section 14 — collaborative-filtering signal (see collaborativeFilter.js).
// `collaborativeSignal` is a single Map for the whole viewer (looked up per
// candidate here), same shape/usage pattern as `tasteProfile`'s
// hobbyWeights — neutral (0.5) both for a cold-start viewer (signal is
// null) and for any candidate no similar neighbor happened to like, since
// this signal is vote-only (no negative/avoidance side yet, unlike
// behavioralScore) — absence of a vote just means no evidence either way.
function collaborativeScore(candidate, collaborativeSignal) {
  if (!collaborativeSignal) return 0.5;
  const vote = collaborativeSignal.get(candidate._id.toString());
  return vote === undefined ? 0.5 : 0.5 + vote * 0.5;
}

// Computes every feature for one viewer/candidate pair. Kept as plain
// functions (not classes) so any single feature can be swapped or replaced
// by a learned model later without touching the others (Section 36).
export function extractFeatures(viewerProfile, candidate, tasteProfile, collaborativeSignal) {
  return {
    interestScore: interestScore(viewerProfile.hobbies, candidate.hobbies),
    relationshipScore: relationshipGoalScore(viewerProfile.relationshipGoals, candidate.relationshipGoals),
    activityScore: activityScore(candidate.userDoc?.lastActiveAt),
    completenessScore: profileCompletenessScore(candidate),
    boostScore: boostScore(candidate),
    behavioralScore: behavioralScore(candidate, tasteProfile),
    lifestyleScore: lifestyleScore(viewerProfile.lifestyle, candidate.lifestyle),
    distanceScore: distanceScore(viewerProfile, candidate),
    collaborativeScore: collaborativeScore(candidate, collaborativeSignal),
  };
}
