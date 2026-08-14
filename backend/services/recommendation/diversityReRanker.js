import { DIVERSITY_WINDOW } from "./rankingWeights.js";

const HOBBY_OVERLAP_TOO_SIMILAR = 0.7;
const AGE_GAP_TOO_SIMILAR = 1;

function isTooSimilar(a, b) {
  if (a.profession && b.profession && a.profession.toLowerCase() === b.profession.toLowerCase()) {
    return true;
  }
  if (typeof a.age === "number" && typeof b.age === "number" && Math.abs(a.age - b.age) <= AGE_GAP_TOO_SIMILAR) {
    return true;
  }

  const hobbiesA = new Set((a.hobbies || []).map((h) => h.toLowerCase().trim()));
  const hobbiesB = new Set((b.hobbies || []).map((h) => h.toLowerCase().trim()));
  if (hobbiesA.size > 0 && hobbiesB.size > 0) {
    let overlap = 0;
    for (const hobby of hobbiesA) if (hobbiesB.has(hobby)) overlap++;
    const overlapRatio = overlap / Math.min(hobbiesA.size, hobbiesB.size);
    if (overlapRatio >= HOBBY_OVERLAP_TOO_SIMILAR) return true;
  }

  return false;
}

// Section 25 — a page of 20 near-identical top scorers is a worse feed than
// a slightly lower-scoring but varied one. Greedy sliding-window re-rank:
// walk the list in its current (score/exploration) order, deferring a
// candidate if it's too similar to any of the last DIVERSITY_WINDOW picks,
// then append deferred candidates back at the end — still shown, just not
// clustered next to something near-identical. Never removes anyone (that
// would violate hard filters' exclusivity over eligibility).
export function applyDiversity(orderedEntries) {
  const selected = [];
  const deferred = [];

  for (const entry of orderedEntries) {
    const recentlySelected = selected.slice(-DIVERSITY_WINDOW);
    const tooSimilar = recentlySelected.some((s) => isTooSimilar(s.candidate, entry.candidate));
    if (tooSimilar) {
      deferred.push(entry);
    } else {
      selected.push(entry);
    }
  }

  return [...selected, ...deferred];
}
