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

const DEALBREAKER_FIELD_PATHS = {
  relationshipGoals: "relationshipGoals",
  smoking: "lifestyle.smoking",
  drinking: "lifestyle.drinking",
  pets: "lifestyle.pets",
  wantsChildren: "lifestyle.wantsChildren",
};

function getViewerDealbreakerValue(viewerProfile, key) {
  if (key === "relationshipGoals") return viewerProfile.relationshipGoals;
  return viewerProfile.lifestyle?.[key];
}

// Section 6 — dealbreakers: a user can promote a normally-soft compatibility
// signal (relationshipGoals, or a lifestyle attribute) into a hard filter
// via preferences.dealbreakers (see profileController.js's DEALBREAKER_KEYS
// for the allowed set). Only enforced when the viewer has both opted in AND
// actually stated a value for that field themselves — there's nothing
// meaningful to hard-filter against an unset preference.
export function buildDealbreakerMatch(viewerProfile) {
  const dealbreakers = viewerProfile.preferences?.dealbreakers || [];
  const match = {};

  for (const key of dealbreakers) {
    const fieldPath = DEALBREAKER_FIELD_PATHS[key];
    const viewerValue = getViewerDealbreakerValue(viewerProfile, key);
    if (fieldPath && viewerValue) {
      match[fieldPath] = viewerValue;
    }
  }

  return match;
}

const EARTH_RADIUS_KM = 6371;

// Section 6/9.6 — distance hard filter. Only enforced when the viewer has
// both set a max distance AND saved their own coordinates — someone who
// hasn't opted into location sharing gets no distance filtering rather than
// being excluded from discovery entirely. Uses $geoWithin/$centerSphere
// (not $geoNear) specifically so this can live as an ordinary $match stage
// — $geoNear is required to be the pipeline's first stage, which would
// force restructuring the safety/hard-filter ordering elsewhere.
export function buildDistanceMatch(viewerProfile) {
  const maxDistanceKm = viewerProfile.preferences?.maxDistanceKm;
  const viewerCoords = viewerProfile.coordinates?.coordinates;
  if (!maxDistanceKm || !viewerCoords || viewerCoords.length !== 2) return {};

  return {
    coordinates: {
      $geoWithin: {
        $centerSphere: [viewerCoords, maxDistanceKm / EARTH_RADIUS_KM],
      },
    },
  };
}

// Liked, super-liked, and matched candidates are excluded permanently —
// unlike a pass (see candidateGenerator.js's cooldown handling), there's no
// product reason to ever resurface someone the viewer already committed to
// or is already matched with.
export function buildPermanentSwipedMatch(viewerProfile) {
  const swipedIds = [
    ...viewerProfile.likes,
    ...viewerProfile.superLikes,
    ...viewerProfile.matches,
  ];
  return swipedIds.length > 0 ? { _id: { $nin: swipedIds } } : {};
}
