// Rule-based ranking weights (Section 16). These are starting values, not
// scientifically tuned ones — the architecture keeps them in one place
// specifically so they can be swapped for learned/experiment-driven values
// later (Section 4/34) without touching rankingEngine.js's logic.
export const RANKING_WEIGHTS = {
  interestScore: 0.12,
  relationshipScore: 0.08,
  activityScore: 0.08,
  completenessScore: 0.08,
  boostScore: 0.12,
  behavioralScore: 0.12,
  // Phase 3 — mutual-interest estimate (see reciprocalScorer.js). Weighted
  // highest of all signals: a candidate the viewer would like but who is
  // unlikely to reciprocate is a weaker recommendation than the one-sided
  // features alone would suggest.
  reciprocalScore: 0.22,
  // Section 9.4 — lifestyle compatibility (smoking/drinking/pets/children).
  lifestyleScore: 0.09,
  // Section 9.6 — proximity (soft signal; the hard cutoff lives in
  // hardFilter.js and only applies when the viewer sets a max distance).
  distanceScore: 0.09,
};

// Phase 2 tuning knobs — also starting values, not tuned ones (Section 42).
export const EXPLORATION_RATIO = 0.2; // fraction of a feed page reserved for exploration
export const DIVERSITY_WINDOW = 3; // how many recently-selected candidates a new pick is compared against

export const ALGORITHM_VERSION = "recommendation-v3";
