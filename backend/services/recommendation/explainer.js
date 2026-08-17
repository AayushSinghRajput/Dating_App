import RecommendationImpression from "../../models/recommendationImpressionModel.js";
import { RANKING_WEIGHTS } from "./rankingWeights.js";

// Section 35 — explainability. Reads back the per-feature score breakdown
// recommendationLogger.js already persists on every RecommendationImpression
// and turns the strongest contributors into plain-language reasons. This is
// deliberately internal/non-numeric by design (Section 35: "do not expose
// sensitive internal scores or private behavioral information to users
// unless explicitly designed and safe") — callers get short reason strings,
// never raw scores, weights, or feature names.

// Only call out a feature if it scored meaningfully above neutral (0.5) —
// a middling score isn't a reason to show someone, it's just "no signal".
const REASON_THRESHOLD = 0.6;
const MAX_REASONS = 3;

// boostScore is intentionally excluded — same reasoning as
// reciprocalScorer.js's ATTRACTION_FEATURE_WEIGHTS: paying for visibility
// isn't a genuine compatibility signal, so it isn't a legitimate "why" either.
const FEATURE_REASONS = {
  interestScore: "You share several interests",
  relationshipScore: "You're both looking for the same kind of relationship",
  activityScore: "They've been active recently",
  completenessScore: "They have a detailed profile",
  behavioralScore: "Similar to people you've liked before",
  lifestyleScore: "Your lifestyles are compatible",
  distanceScore: "They're nearby",
  reciprocalScore: "You're likely to be mutually interested",
  collaborativeScore: "People with similar taste to yours liked this profile",
};

// Ranked by weighted contribution (weight * score) — the same combination
// rankingEngine.js uses for finalScore — so the reasons given actually match
// how this candidate was ranked, not just which raw feature happened to be
// highest.
function topReasons(features) {
  return Object.entries(FEATURE_REASONS)
    .map(([key, reason]) => ({
      reason,
      score: features[key] ?? 0.5,
      contribution: (features[key] ?? 0.5) * (RANKING_WEIGHTS[key] ?? 0),
    }))
    .filter((entry) => entry.score >= REASON_THRESHOLD)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, MAX_REASONS)
    .map((entry) => entry.reason);
}

// Returns { reasons: string[] } — an empty array (not an error) both when
// this candidate has never actually been shown to the viewer yet, and when
// nothing scored meaningfully above neutral.
export async function explainRecommendation(viewerUserId, candidateUserId) {
  const impression = await RecommendationImpression.findOne({
    requestingUser: viewerUserId,
    candidateUser: candidateUserId,
  })
    .sort({ createdAt: -1 })
    .select("features")
    .lean();

  if (!impression?.features) return { reasons: [] };

  return { reasons: topReasons(impression.features) };
}
