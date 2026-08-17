// Rule-based ranking weights (Section 16). These are starting values, not
// scientifically tuned ones — the architecture keeps them in one place
// specifically so they can be swapped for learned/experiment-driven values
// later (Section 4/34) without touching rankingEngine.js's logic.
export const RANKING_WEIGHTS = {
  interestScore: 0.11,
  relationshipScore: 0.074,
  activityScore: 0.074,
  completenessScore: 0.074,
  boostScore: 0.11,
  behavioralScore: 0.11,
  // Phase 3 — mutual-interest estimate (see reciprocalScorer.js). Weighted
  // highest of all signals: a candidate the viewer would like but who is
  // unlikely to reciprocate is a weaker recommendation than the one-sided
  // features alone would suggest.
  reciprocalScore: 0.202,
  // Section 9.4 — lifestyle compatibility (smoking/drinking/pets/children).
  lifestyleScore: 0.083,
  // Section 9.6 — proximity (soft signal; the hard cutoff lives in
  // hardFilter.js and only applies when the viewer sets a max distance).
  distanceScore: 0.083,
  // Phase 4 — collaborative-filtering signal (see collaborativeFilter.js).
  // Weighted modestly: it's the newest, least-validated signal, and is
  // neutral for most viewers until they've liked enough profiles to have a
  // meaningful neighbor set (Section 42's cold-start staging).
  collaborativeScore: 0.08,
};

// Phase 2 tuning knobs — also starting values, not tuned ones (Section 42).
export const EXPLORATION_RATIO = 0.2; // fraction of a feed page reserved for exploration
export const DIVERSITY_WINDOW = 3; // how many recently-selected candidates a new pick is compared against

export const ALGORITHM_VERSION = "recommendation-v3";

// Section 33/34 — a second named weight configuration so two ranking
// strategies can be compared head-to-head (via experimentVariant on
// RecommendationImpression, see recommendationLogger.js) instead of only
// ever running one global config. Shifts weight from boost/completeness
// toward reciprocalScore — a plausible hypothesis (mutual interest matters
// more than who paid for visibility or filled out every field), not a
// validated one; that's exactly what running it as an experiment is for.
// Still sums to 1, same convention as RANKING_WEIGHTS.
const RECIPROCAL_HEAVY_WEIGHTS = {
  interestScore: 0.11,
  relationshipScore: 0.074,
  activityScore: 0.074,
  completenessScore: 0.046,
  boostScore: 0.074,
  behavioralScore: 0.11,
  reciprocalScore: 0.276,
  lifestyleScore: 0.074,
  distanceScore: 0.083,
  collaborativeScore: 0.08,
};

export const RANKING_WEIGHT_VARIANTS = {
  control: RANKING_WEIGHTS,
  "reciprocal-heavy": RECIPROCAL_HEAVY_WEIGHTS,
};

const VARIANT_NAMES = Object.keys(RANKING_WEIGHT_VARIANTS);

// djb2 string hash — deterministic and dependency-free, so the same user
// always lands in the same bucket across requests without needing to
// persist an assignment anywhere.
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0; // unsigned
}

// Stable per-user bucketing across the configured variants. Bucketing is by
// raw user id rather than anything behavioral, so assignment can't itself
// introduce bias into which users see which ranking strategy.
export function getVariantForUser(userId) {
  const index = hashString(userId.toString()) % VARIANT_NAMES.length;
  return VARIANT_NAMES[index];
}
