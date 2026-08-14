import { extractFeatures } from "./featureExtractor.js";
import { buildTasteProfilesForUsers } from "./behaviorModel.js";

// Subset of extractFeatures' output used for "how likely is X to like Y" —
// deliberately excludes boostScore (paying for visibility isn't the same
// thing as being liked) and any freshness/exposure penalty (those are
// delivery mechanics, not attraction signals).
const ATTRACTION_FEATURE_WEIGHTS = {
  interestScore: 0.25,
  relationshipScore: 0.2,
  activityScore: 0.2,
  completenessScore: 0.15,
  behavioralScore: 0.2,
};

function combineAttractionFeatures(features) {
  return Object.entries(ATTRACTION_FEATURE_WEIGHTS).reduce(
    (sum, [key, weight]) => sum + (features[key] ?? 0.5) * weight,
    0
  );
}

// Section 12/13 — instead of only asking "is this candidate a good match
// for the viewer", also estimate the reverse direction using the same
// feature machinery with the roles swapped, then combine both into a
// single mutual-interest signal. Geometric mean (not a raw product) so one
// very low-confidence side doesn't crush the score toward zero the way a
// straight multiplication would, while still rewarding true mutual fit
// more than either one-sided score alone.
export async function computeReciprocalScores(viewerProfile, viewerLastActiveAt, candidates, viewerTasteProfile) {
  const scoreByProfileId = new Map();
  if (candidates.length === 0) return scoreByProfileId;

  const candidateUserIds = candidates.map((c) => c.user);
  const candidateTasteProfiles = await buildTasteProfilesForUsers(candidateUserIds);

  // A minimal stand-in "candidate" shape for the viewer, so the reverse
  // direction can reuse extractFeatures exactly as-is.
  const viewerAsCandidate = {
    hobbies: viewerProfile.hobbies,
    age: viewerProfile.age,
    relationshipGoals: viewerProfile.relationshipGoals,
    photos: viewerProfile.photos,
    aboutMe: viewerProfile.aboutMe,
    prompts: viewerProfile.prompts,
    userDoc: { lastActiveAt: viewerLastActiveAt },
  };

  for (const candidate of candidates) {
    const pViewerLikesCandidate = combineAttractionFeatures(
      extractFeatures(viewerProfile, candidate, viewerTasteProfile)
    );

    const candidateAsViewer = { hobbies: candidate.hobbies, relationshipGoals: candidate.relationshipGoals };
    const candidateTaste = candidateTasteProfiles.get(candidate.user.toString()) || null;
    const pCandidateLikesViewer = combineAttractionFeatures(
      extractFeatures(candidateAsViewer, viewerAsCandidate, candidateTaste)
    );

    const reciprocalScore = Math.sqrt(
      Math.max(0, pViewerLikesCandidate) * Math.max(0, pCandidateLikesViewer)
    );
    scoreByProfileId.set(candidate._id.toString(), reciprocalScore);
  }

  return scoreByProfileId;
}
