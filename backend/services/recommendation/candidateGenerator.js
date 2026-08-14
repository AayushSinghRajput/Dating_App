import mongoose from "mongoose";
import Profile from "../../models/profileModel.js";
import { buildProfileSafetyMatch, excludeBannedUsersMatch } from "./safetyFilter.js";
import {
  buildAgeRangeStages,
  buildAlreadySwipedMatch,
  buildDealbreakerMatch,
  buildDistanceMatch,
  passesGenderReciprocal,
} from "./hardFilter.js";

// How many eligible profiles to pull before scoring/ranking. At this app's
// current scale a full rank-then-slice over a few hundred candidates is
// plenty fast — no need for a fancier retrieval strategy (geo bucketing,
// ANN index, etc.) until real usage numbers justify it.
const CANDIDATE_POOL_SIZE = 300;

// Stages 1+2 of the pipeline (safety + hard filters), producing a bounded,
// fully-eligible candidate pool for the ranking stage to score. Every
// exclusion here is deterministic — nothing later can rank a candidate back
// into this pool once they've been filtered out.
export async function generateCandidates(viewerProfile, viewerUserId) {
  const blockedByMe = (viewerProfile.blockedUsers || []).map(
    (id) => new mongoose.Types.ObjectId(id)
  );
  const viewerMinAge = viewerProfile.preferences?.minAge ?? 18;
  const viewerMaxAge = viewerProfile.preferences?.maxAge ?? 99;
  const viewerAge = viewerProfile.age;

  const pipeline = [
    {
      $match: {
        ...buildProfileSafetyMatch(viewerUserId, blockedByMe),
        ...buildAlreadySwipedMatch(viewerProfile),
        ...buildDealbreakerMatch(viewerProfile),
        ...buildDistanceMatch(viewerProfile),
      },
    },
    // Age is optional on a profile (onboarding doesn't always guarantee it
    // for legacy data) — without a viewer age there's nothing to compare
    // against, so skip the range filter rather than excluding everyone.
    ...(viewerAge ? buildAgeRangeStages(viewerAge, viewerMinAge, viewerMaxAge) : []),
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userDoc",
        pipeline: [{ $project: { username: 1, banned: 1, lastActiveAt: 1 } }],
      },
    },
    { $unwind: { path: "$userDoc", preserveNullAndEmptyArrays: true } },
    { $match: excludeBannedUsersMatch },
    { $limit: CANDIDATE_POOL_SIZE },
  ];

  const candidates = await Profile.aggregate(pipeline);

  // Gender/interestedIn reciprocity needs the viewer's own fields and
  // involves a small enum-mapping quirk (see hardFilter.js) that's simplest
  // expressed in JS — cheap now that the pool is already capped.
  return candidates.filter((candidate) => passesGenderReciprocal(viewerProfile, candidate));
}
