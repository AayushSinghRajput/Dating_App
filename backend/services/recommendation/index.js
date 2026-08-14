import Profile from "../../models/profileModel.js";
import User from "../../models/userModel.js";
import { generateCandidates } from "./candidateGenerator.js";
import { computeFreshnessPenalties } from "./freshnessEngine.js";
import { buildTasteProfile } from "./behaviorModel.js";
import { computeReciprocalScores } from "./reciprocalScorer.js";
import { computePopularityPenalties } from "./popularityControl.js";
import { scoreCandidates, rankByScore } from "./rankingEngine.js";
import { applyExploration } from "./explorationEngine.js";
import { applyDiversity } from "./diversityReRanker.js";
import { logImpressions } from "./recommendationLogger.js";
import { ALGORITHM_VERSION } from "./rankingWeights.js";

// Orchestrates the full Phase 1 + 2 + 3 discovery pipeline (Section 4):
//   Safety & eligibility -> Hard filters -> Candidate generation
//   -> Feature engineering (incl. behavioral) -> Reciprocal scoring
//   -> Ranking -> Exploration -> Diversity -> Final feed -> Impression logging
// Each stage is an independently swappable module (Section 36) — this file
// only wires them together, it doesn't contain filtering/scoring logic
// itself, so later phases (collaborative filtering, ML ranking) can replace
// individual stages without touching this contract.
export async function getDiscoveryFeed(viewerUserId, { page = 1, limit = 20 } = {}) {
  const [viewerProfile, viewerUser] = await Promise.all([
    Profile.findOne({ user: viewerUserId }).lean(),
    User.findById(viewerUserId).select("lastActiveAt").lean(),
  ]);
  if (!viewerProfile) {
    return { profiles: [], algorithmVersion: ALGORITHM_VERSION };
  }

  const [candidates, tasteProfile] = await Promise.all([
    generateCandidates(viewerProfile, viewerUserId),
    buildTasteProfile(viewerUserId),
  ]);

  const [freshnessPenalties, reciprocalScores, popularityPenalties] = await Promise.all([
    computeFreshnessPenalties(viewerUserId, candidates),
    computeReciprocalScores(viewerProfile, viewerUser?.lastActiveAt, candidates, tasteProfile),
    computePopularityPenalties(candidates),
  ]);
  const scored = scoreCandidates(
    viewerProfile,
    candidates,
    freshnessPenalties,
    tasteProfile,
    reciprocalScores,
    popularityPenalties
  );
  const ranked = rankByScore(scored);

  // Exploration/diversity re-ranking operate on "the next page to show" and
  // are only meaningful for page 1 — the only page the app currently
  // requests (see frontend/services/profileService.ts, no pagination UI
  // wired yet). Later pages fall back to a plain ranked slice rather than
  // reconstructing exploration/diversity state across page boundaries.
  let pageEntries;
  if (page === 1) {
    const explored = await applyExploration(ranked, limit);
    pageEntries = applyDiversity(explored);
  } else {
    const start = (page - 1) * limit;
    pageEntries = ranked.slice(start, start + limit);
  }

  await logImpressions(viewerUserId, pageEntries);

  const profiles = pageEntries.map(({ candidate }) => ({
    id: candidate._id,
    userId: candidate.user,
    name: candidate.name || candidate.userDoc?.username,
    age: candidate.age,
    profileImage: candidate.profileImage,
    photos: candidate.photos,
    profession: candidate.profession,
    location: candidate.location,
    aboutMe: candidate.aboutMe,
    gender: candidate.gender,
    interestedIn: candidate.interestedIn,
    hobbies: candidate.hobbies,
    education: candidate.education,
    relationshipGoals: candidate.relationshipGoals,
    isVerified: candidate.verified,
    prompts: candidate.prompts,
    isBoosted: candidate.boostedUntil ? new Date(candidate.boostedUntil) > new Date() : false,
  }));

  return { profiles, algorithmVersion: ALGORITHM_VERSION };
}
