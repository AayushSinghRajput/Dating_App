// Stage 2 — hard filters. Unlike ranking features, these either exclude a
// candidate outright or they don't; a high score elsewhere can never buy
// back eligibility lost here.
//
// interestedIn's enum ("male" | "women" | "everyone") doesn't line up
// string-for-string with gender's enum ("male" | "female" | "non-binary" |
// "other") — this bridges that mismatch instead of silently failing to
// match "women" against "female".
function interestedInMatchesGender(interestedIn, gender) {
  if (!interestedIn || interestedIn === "everyone") return true; // unset = no restriction
  if (!gender) return true; // candidate hasn't set gender — don't hard-filter on absence
  if (interestedIn === "male") return gender === "male";
  if (interestedIn === "women") return gender === "female";
  return true;
}

// True if viewer and candidate are mutually within each other's stated
// gender preference. Reciprocal by design (Section 6 of the spec): a
// candidate only passes if BOTH sides' preferences are satisfied.
export function passesGenderReciprocal(viewer, candidate) {
  return (
    interestedInMatchesGender(viewer.interestedIn, candidate.gender) &&
    interestedInMatchesGender(candidate.interestedIn, viewer.gender)
  );
}

// Aggregation stages enforcing the reciprocal age-range hard filter directly
// in Mongo. Uses $ifNull so profiles saved before the `preferences` field
// existed (no migration ran) fall back to the same 18–99 default the schema
// declares, instead of being silently excluded from every feed.
export function buildAgeRangeStages(viewerAge, viewerMinAge, viewerMaxAge) {
  return [
    {
      $addFields: {
        _effectiveMinAge: { $ifNull: ["$preferences.minAge", 18] },
        _effectiveMaxAge: { $ifNull: ["$preferences.maxAge", 99] },
      },
    },
    {
      $match: {
        age: { $gte: viewerMinAge, $lte: viewerMaxAge },
        _effectiveMinAge: { $lte: viewerAge },
        _effectiveMaxAge: { $gte: viewerAge },
      },
    },
  ];
}

// Already-swiped candidates (liked, passed, super-liked, or matched) are
// excluded outright for now. Re-surfacing old passes after a cooldown is a
// real product idea (per spec Section 6) but is a configuration decision
// deferred to a later pass, not a Phase 1 requirement.
export function buildAlreadySwipedMatch(viewerProfile) {
  const swipedIds = [
    ...viewerProfile.likes,
    ...viewerProfile.passes,
    ...viewerProfile.superLikes,
    ...viewerProfile.matches,
  ];
  return swipedIds.length > 0 ? { _id: { $nin: swipedIds } } : {};
}
